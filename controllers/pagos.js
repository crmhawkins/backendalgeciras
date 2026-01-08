const { response } = require('express');

// Inicializar Stripe solo si hay una clave válida
let stripe = null;
try {
    if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_placeholder') {
        stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    } else {
        console.warn('⚠️  STRIPE_SECRET_KEY no configurada. El sistema de pagos no funcionará hasta que se configure.');
        // Crear un objeto mock para evitar errores
        stripe = {
            checkout: {
                sessions: {
                    create: () => Promise.reject(new Error('Stripe no está configurado')),
                    retrieve: () => Promise.reject(new Error('Stripe no está configurado'))
                }
            },
            webhooks: {
                constructEvent: () => { throw new Error('Stripe no está configurado'); }
            }
        };
    }
} catch (error) {
    console.error('Error al inicializar Stripe:', error);
    throw error;
}
const PagoSession = require('../models/pagoSession');
const Entrada = require('../models/entrada');
const Abono = require('../models/abono');
const Usuario = require('../models/usuario');
const Partido = require('../models/partido');
const Asiento = require('../models/asiento');
const Sector = require('../models/sector');
const bcryptjs = require('bcryptjs');
const generarPasswordAleatoria = require('../helpers/generarPasswordAleatoria');
const nodemailer = require('nodemailer');
const { actualizarJSONAsiento } = require('../services/updateJSON');

/**
 * Crea una sesión de pago de Stripe para entradas
 */
const crearSesionPagoEntrada = async (req, res = response) => {
    if (!stripe || !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_placeholder') {
        return res.status(503).json({ 
            msg: 'El sistema de pagos no está configurado. Por favor, contacta al administrador.' 
        });
    }
    
    try {
        const {
            partidoId,
            asientoId,
            precio,
            nombre,
            apellidos,
            genero,
            dni,
            fechaNacimiento,
            email,
            telefono,
            pais,
            provincia,
            localidad,
            domicilio,
            codigoPostal
        } = req.body;

        // Validar que el asiento existe y está disponible
        const asiento = await Asiento.findByPk(asientoId, {
            include: { model: Sector, attributes: ['nombre', 'precio'] }
        });

        if (!asiento) {
            return res.status(400).json({ msg: 'El asiento no existe.' });
        }

        // Verificar si existe una entrada para este partido y asiento
        const existente = await Entrada.findOne({ where: { partidoId, asientoId } });
        if (existente && existente.usuarioId !== 1) {
            return res.status(400).json({ msg: 'Este asiento ya está reservado para este partido.' });
        }

        // Verificar si el asiento está ocupado por un abono activo
        if (asiento.estado === 'ocupado') {
            const Abono = require('../models/abono');
            const abonoActivo = await Abono.findOne({
                where: { asientoId, activo: true }
            });
            if (abonoActivo) {
                return res.status(400).json({
                    msg: 'Este asiento está ocupado por un abono activo. No se puede comprar una entrada.'
                });
            }
        }

        const partido = await Partido.findByPk(partidoId);
        if (!partido) {
            return res.status(400).json({ msg: 'El partido no existe.' });
        }

        // Calcular monto total (convertir a centavos para Stripe)
        const montoCentavos = Math.round(Number(precio) * 100);

        // Crear sesión de pago en Stripe
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: `Entrada - ${partido.equipoLocal} vs ${partido.equipoVisitante}`,
                            description: `Fila ${asiento.fila}, Butaca ${asiento.numero} - Sector ${asiento.Sector?.nombre || 'N/A'}`,
                        },
                        unit_amount: montoCentavos,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pago-exitoso?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pago-cancelado`,
            customer_email: email,
            metadata: {
                tipo: 'entrada',
                partidoId: partidoId.toString(),
                asientoId: asientoId.toString(),
            },
        });

        // Guardar datos de la compra en la base de datos
        const datosCompra = {
            partidoId,
            asientoId,
            precio,
            nombre,
            apellidos,
            genero,
            dni,
            fechaNacimiento,
            email,
            telefono,
            pais,
            provincia,
            localidad,
            domicilio,
            codigoPostal
        };

        // Fecha de expiración: 30 minutos desde ahora
        const fechaExpiracion = new Date();
        fechaExpiracion.setMinutes(fechaExpiracion.getMinutes() + 30);

        await PagoSession.create({
            stripeSessionId: session.id,
            tipo: 'entrada',
            estado: 'pendiente',
            datosCompra,
            monto: precio,
            fechaExpiracion
        });

        res.json({
            sessionId: session.id,
            url: session.url
        });

    } catch (error) {
        console.error('Error al crear sesión de pago:', error);
        res.status(500).json({
            msg: 'Error al crear la sesión de pago',
            error: error.message
        });
    }
};

/**
 * Crea una sesión de pago de Stripe para abonos
 */
const crearSesionPagoAbono = async (req, res = response) => {
    if (!stripe || !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_placeholder') {
        return res.status(503).json({ 
            msg: 'El sistema de pagos no está configurado. Por favor, contacta al administrador.' 
        });
    }
    
    try {
        const {
            fechaInicio,
            fechaFin,
            asientoId,
            nombre,
            apellidos,
            genero,
            dni,
            fechaNacimiento,
            email,
            telefono,
            pais,
            provincia,
            localidad,
            domicilio,
            codigoPostal
        } = req.body;

        // Validar que el asiento existe y está disponible
        const asiento = await Asiento.findByPk(asientoId, {
            include: { model: Sector, attributes: ['nombre', 'precio'] }
        });

        if (!asiento) {
            return res.status(400).json({ msg: 'El asiento no existe.' });
        }

        if (!asiento.Sector) {
            return res.status(400).json({ msg: 'El sector del asiento no existe.' });
        }

        if (asiento.estado === 'ocupado') {
            return res.status(400).json({ msg: 'El asiento no está disponible' });
        }

        const precio = Number(asiento.Sector.precio);
        const montoCentavos = Math.round(precio * 100);

        // Crear sesión de pago en Stripe
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: `Abono de Temporada - Algeciras CF`,
                            description: `Sector ${asiento.Sector.nombre} - Fila ${asiento.fila}, Butaca ${asiento.numero}`,
                        },
                        unit_amount: montoCentavos,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pago-exitoso?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pago-cancelado`,
            customer_email: email,
            metadata: {
                tipo: 'abono',
                asientoId: asientoId.toString(),
            },
        });

        // Guardar datos de la compra en la base de datos
        const datosCompra = {
            fechaInicio,
            fechaFin,
            asientoId,
            nombre,
            apellidos,
            genero,
            dni,
            fechaNacimiento,
            email,
            telefono,
            pais,
            provincia,
            localidad,
            domicilio,
            codigoPostal
        };

        // Fecha de expiración: 30 minutos desde ahora
        const fechaExpiracion = new Date();
        fechaExpiracion.setMinutes(fechaExpiracion.getMinutes() + 30);

        await PagoSession.create({
            stripeSessionId: session.id,
            tipo: 'abono',
            estado: 'pendiente',
            datosCompra,
            monto: precio,
            fechaExpiracion
        });

        res.json({
            sessionId: session.id,
            url: session.url
        });

    } catch (error) {
        console.error('Error al crear sesión de pago:', error);
        res.status(500).json({
            msg: 'Error al crear la sesión de pago',
            error: error.message
        });
    }
};

/**
 * Confirma el pago y crea la entrada/abono correspondiente
 */
const confirmarPago = async (req, res = response) => {
    if (!stripe || !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_placeholder') {
        return res.status(503).json({ 
            msg: 'El sistema de pagos no está configurado. Por favor, contacta al administrador.' 
        });
    }
    
    try {
        const { session_id } = req.query;

        if (!session_id) {
            return res.status(400).json({ msg: 'El session_id es requerido' });
        }

        // Buscar la sesión de pago en la base de datos
        const pagoSession = await PagoSession.findOne({
            where: { stripeSessionId: session_id }
        });

        if (!pagoSession) {
            return res.status(404).json({ msg: 'Sesión de pago no encontrada' });
        }

        if (pagoSession.estado === 'completado') {
            return res.status(400).json({ msg: 'Este pago ya fue procesado' });
        }

        // Verificar el estado del pago en Stripe
        const stripeSession = await stripe.checkout.sessions.retrieve(session_id);

        if (stripeSession.payment_status !== 'paid') {
            return res.status(400).json({ msg: 'El pago no ha sido completado' });
        }

        const datosCompra = pagoSession.datosCompra;

        // Crear o buscar usuario
        let usuario = await Usuario.findOne({ where: { email: datosCompra.email } });
        let nuevaCuenta = false;
        let passwordPlano = '';

        if (!usuario) {
            passwordPlano = generarPasswordAleatoria(10);
            const salt = bcryptjs.genSaltSync();
            const hashedPassword = bcryptjs.hashSync(passwordPlano, salt);

            usuario = await Usuario.create({
                nombre: datosCompra.nombre,
                email: datosCompra.email,
                profileImage: 'default_profile_photo.png',
                password: hashedPassword,
                dni: datosCompra.dni
            });

            nuevaCuenta = true;
        }

        let resultado = null;

        if (pagoSession.tipo === 'entrada') {
            // Crear entrada
            const entrada = await Entrada.create({
                partidoId: datosCompra.partidoId,
                asientoId: datosCompra.asientoId,
                precio: datosCompra.precio,
                usuarioId: usuario.id
            });

            // Actualizar estado del asiento
            const asiento = await Asiento.findByPk(datosCompra.asientoId);
            if (asiento && asiento.estado !== 'ocupado') {
                asiento.estado = 'ocupado';
                await asiento.save();
            }

            // Enviar email de confirmación
            const partido = await Partido.findByPk(datosCompra.partidoId);
            const asientoDetalle = await Asiento.findByPk(datosCompra.asientoId, {
                include: { model: Sector, attributes: ['nombre'] }
            });

            if (nuevaCuenta) {
                const transporter = nodemailer.createTransport({
                    host: process.env.EMAIL_HOST,
                    port: process.env.EMAIL_PORT,
                    secure: process.env.EMAIL_ENCRYPTION === 'ssl',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS
                    }
                });

                await transporter.sendMail({
                    from: `"Algeciras CF" <${process.env.EMAIL_USER}>`,
                    to: datosCompra.email,
                    subject: '🎟️ Entrada comprada - Algeciras CF',
                    html: `
                        <h2>¡Gracias por tu compra en Algeciras CF!</h2>
                        <p>Te hemos creado una cuenta para que puedas acceder a tu perfil y consultar tus entradas.</p>
                        <p><strong>Email de acceso:</strong> ${datosCompra.email}</p>
                        <p><strong>Contraseña generada:</strong> ${passwordPlano}</p>
                        <hr/>
                        <h3>📅 Detalles de tu entrada:</h3>
                        <p><strong>Partido:</strong> ${partido.equipoLocal} vs ${partido.equipoVisitante}</p>
                        <p><strong>Fecha:</strong> ${new Date(partido.fecha).toLocaleDateString()}</p>
                        <p><strong>Hora:</strong> ${partido.hora || 'Por determinar'}</p>
                        <p><strong>Asiento:</strong> Fila ${asientoDetalle.fila}, Butaca ${asientoDetalle.numero}</p>
                        <p><strong>Sector:</strong> ${asientoDetalle.Sector?.nombre || 'N/A'}</p>
                        <p><strong>Precio:</strong> ${datosCompra.precio} €</p>
                        <hr/>
                        <p>⚽ Puedes acceder a tu cuenta desde nuestra web para revisar tus compras o renovar tus entradas.</p>
                        <p><strong>algecirascf.com</strong></p>
                    `
                });
            }

            resultado = { entrada, nuevaCuenta };

        } else if (pagoSession.tipo === 'abono') {
            // Crear abono
            const abono = await Abono.create({
                fechaInicio: datosCompra.fechaInicio,
                fechaFin: datosCompra.fechaFin,
                nombre: datosCompra.nombre,
                apellidos: datosCompra.apellidos,
                genero: datosCompra.genero,
                dni: datosCompra.dni,
                fechaNacimiento: datosCompra.fechaNacimiento,
                email: datosCompra.email,
                telefono: datosCompra.telefono,
                pais: datosCompra.pais,
                provincia: datosCompra.provincia,
                localidad: datosCompra.localidad,
                domicilio: datosCompra.domicilio,
                codigoPostal: datosCompra.codigoPostal,
                usuarioId: usuario.id,
                asientoId: datosCompra.asientoId,
                precio: pagoSession.monto
            });

            // Actualizar estado del asiento
            const asiento = await Asiento.findByPk(datosCompra.asientoId, {
                include: { model: Sector, attributes: ['nombre'] }
            });
            asiento.estado = 'ocupado';
            await asiento.save();
            actualizarJSONAsiento(datosCompra.asientoId, 'ocupado');

            // Enviar email de confirmación
            const transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST,
                port: process.env.EMAIL_PORT,
                secure: process.env.EMAIL_ENCRYPTION === 'ssl',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            await transporter.sendMail({
                from: `"Algeciras CF" <${process.env.EMAIL_USER}>`,
                to: datosCompra.email,
                subject: 'Abono confirmado - Algeciras CF',
                html: `
                    <h2>¡Gracias por adquirir tu abono!</h2>
                    <p><strong>Nombre:</strong> ${datosCompra.nombre} ${datosCompra.apellidos}</p>
                    <p><strong>Zona:</strong> Sector ${asiento.Sector.nombre} - Fila ${asiento.fila}, Butaca ${asiento.numero}</p>
                    <p><strong>Email de acceso:</strong> ${datosCompra.email}</p>
                    ${nuevaCuenta ? `<p><strong>Contraseña generada:</strong> ${passwordPlano}</p>` : ''}
                    <p><strong>Código de abono:</strong> ${abono.id}</p>
                    <p><strong>Precio del abono:</strong> ${pagoSession.monto} €</p>
                    <hr/>
                    <p>⚽ Algeciras CF</p>
                `
            });

            resultado = { abono, nuevaCuenta };
        }

        // Marcar la sesión de pago como completada
        pagoSession.estado = 'completado';
        await pagoSession.save();

        res.json({
            msg: 'Pago confirmado correctamente',
            ...resultado
        });

    } catch (error) {
        console.error('Error al confirmar pago:', error);
        res.status(500).json({
            msg: 'Error al confirmar el pago',
            error: error.message
        });
    }
};

/**
 * Webhook de Stripe para manejar eventos de pago
 */
const webhookStripe = async (req, res) => {
    if (!stripe || !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_placeholder') {
        return res.status(503).json({ 
            msg: 'El sistema de pagos no está configurado.' 
        });
    }
    
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
        return res.status(400).json({ msg: 'STRIPE_WEBHOOK_SECRET no configurado' });
    }

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.error('Error en webhook:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Manejar el evento checkout.session.completed
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        
        // Buscar la sesión de pago en la base de datos
        const pagoSession = await PagoSession.findOne({
            where: { stripeSessionId: session.id }
        });

        if (pagoSession && pagoSession.estado === 'pendiente') {
            // Aquí podrías procesar el pago automáticamente
            // Por ahora, solo lo marcamos como completado si el usuario no completó la redirección
            console.log(`Pago completado para sesión: ${session.id}`);
        }
    }

    res.json({ received: true });
};

module.exports = {
    crearSesionPagoEntrada,
    crearSesionPagoAbono,
    confirmarPago,
    webhookStripe
};
