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
const { generarJWT } = require('../helpers/generarJWT');
const generarIdUnico = require('../helpers/generarIdUnico');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Genera un código de acceso visible para el usuario (hex en mayúsculas, 16 bytes = 32 chars = 128-bit entropy)
const generarCodigoAcceso = (longitud = 16) => {
    const bytes = Math.ceil(longitud / 2);
    return crypto.randomBytes(bytes).toString('hex').toUpperCase().slice(0, longitud);
};
const { actualizarJSONAsiento } = require('../services/updateJSON');
const { verificarAsientoEnCompralaentrada, sincronizarZona } = require('../services/compralaentradaService');

// Singleton transporter — creado una vez al cargar el módulo
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_ENCRYPTION === 'ssl',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

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

        // Precio siempre desde BD — nunca confiar en el cliente
        if (!asiento.Sector || asiento.Sector.precio == null) {
            return res.status(400).json({ msg: 'No se pudo determinar el precio del sector.' });
        }
        const precioFinal = Number(asiento.Sector.precio);

        // Calcular monto total (convertir a centavos para Stripe)
        const montoCentavos = Math.round(precioFinal * 100);

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
            success_url: `${process.env.BACKEND_URL || 'https://backend-algeciras.hawkins.es'}/api/pagos/pago-exitoso?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.BACKEND_URL || 'https://backend-algeciras.hawkins.es'}/api/pagos/pago-cancelado`,
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
            precio: precioFinal,
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
            monto: precioFinal,
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

        // Verificación adicional contra compralaentrada (fail-open: si la API externa falla, no bloqueamos la compra)
        try {
            const libreEnCompralaentrada = await verificarAsientoEnCompralaentrada(
                asiento.sectorId,
                asiento.fila,
                asiento.numero
            );
            if (!libreEnCompralaentrada) {
                return res.status(409).json({
                    msg: 'El asiento está ocupado en el sistema de venta externo (compralaentrada). Elige otro asiento.'
                });
            }
        } catch (errCle) {
            console.warn('[pagos] compralaentrada no disponible, se continúa sin verificación externa:', errCle.message);
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
            success_url: `${process.env.BACKEND_URL || 'https://backend-algeciras.hawkins.es'}/api/pagos/pago-exitoso?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.BACKEND_URL || 'https://backend-algeciras.hawkins.es'}/api/pagos/pago-cancelado`,
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
 * Confirma el pago — solo devuelve estado desde BD.
 * La creación de entrada/abono es responsabilidad exclusiva del webhook.
 */
const confirmarPago = async (req, res = response) => {
    try {
        const { session_id } = req.query;

        if (!session_id) {
            return res.status(400).json({ msg: 'El session_id es requerido' });
        }

        const pagoSession = await PagoSession.findOne({ where: { stripeSessionId: session_id } });

        if (!pagoSession) {
            return res.status(404).json({ msg: 'Sesión de pago no encontrada' });
        }

        return res.json({
            estado: pagoSession.estado,
            tipo: pagoSession.tipo,
            completado: pagoSession.estado === 'completado'
        });

    } catch (error) {
        console.error('Error al consultar estado de pago:', error);
        res.status(500).json({
            msg: 'Error al consultar el estado del pago',
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
        try {
            // CAS atómico — evita race condition con confirmarPago
            const [updatedRows] = await PagoSession.update(
                { estado: 'procesando' },
                { where: { stripeSessionId: session.id, estado: 'pendiente' } }
            );

            if (updatedRows === 0) {
                // Ya procesado o siendo procesado por confirmarPago
                console.log(`[webhook] Sesión ${session.id} ya procesada o en curso — omitiendo`);
                return res.json({ received: true });
            }

            const pagoSession = await PagoSession.findOne({ where: { stripeSessionId: session.id } });
            const datosCompra = pagoSession.datosCompra;

            // Find or create usuario
            let usuario = await Usuario.findOne({ where: { email: datosCompra.email } });
            if (!usuario) {
                const salt = bcryptjs.genSaltSync();
                usuario = await Usuario.create({
                    nombre: datosCompra.nombre,
                    email: datosCompra.email,
                    profileImage: 'default_profile_photo.png',
                    password: bcryptjs.hashSync(generarPasswordAleatoria(10), salt),
                    dni: datosCompra.dni || null
                });
            }

            let sectorId = null;

            if (pagoSession.tipo === 'abono') {
                await Abono.create({
                    fechaInicio: datosCompra.fechaInicio,
                    fechaFin: datosCompra.fechaFin,
                    nombre: datosCompra.nombre,
                    apellidos: datosCompra.apellidos,
                    genero: datosCompra.genero || null,
                    dni: datosCompra.dni || null,
                    fechaNacimiento: datosCompra.fechaNacimiento || null,
                    email: datosCompra.email,
                    telefono: datosCompra.telefono || null,
                    pais: datosCompra.pais || null,
                    provincia: datosCompra.provincia || null,
                    localidad: datosCompra.localidad || null,
                    domicilio: datosCompra.domicilio || null,
                    codigoPostal: datosCompra.codigoPostal || null,
                    usuarioId: usuario.id,
                    asientoId: datosCompra.asientoId,
                    precio: pagoSession.monto,
                    codigoAcceso: generarCodigoAcceso(8)
                });
                const asiento = await Asiento.findByPk(datosCompra.asientoId);
                if (asiento) { asiento.estado = 'ocupado'; await asiento.save(); sectorId = asiento.sectorId; }
                actualizarJSONAsiento(datosCompra.asientoId, 'ocupado');
            } else if (pagoSession.tipo === 'entrada') {
                // Token único con retry (igual que confirmarPago)
                let token = null;
                let intentos = 0;
                do {
                    token = generarIdUnico();
                    const existe = await Entrada.findOne({ where: { token } });
                    if (!existe) break;
                    intentos++;
                } while (intentos < 10);

                await Entrada.create({
                    token,
                    qrCode: token,
                    codigoAcceso: generarCodigoAcceso(12),
                    partidoId: datosCompra.partidoId,
                    asientoId: datosCompra.asientoId,
                    precio: datosCompra.precio,
                    usuarioId: usuario.id
                });
                const asiento = await Asiento.findByPk(datosCompra.asientoId);
                if (asiento) { asiento.estado = 'ocupado'; await asiento.save(); sectorId = asiento.sectorId; }
            }

            pagoSession.estado = 'completado';
            await pagoSession.save();

            if (sectorId) {
                sincronizarZona(sectorId).catch(e => console.warn('[webhook] sync zona error:', e.message));
            }

            console.log(`[webhook] Pago procesado: session=${session.id}`);
        } catch (err) {
            console.error('[webhook] Error procesando checkout.session.completed:', err.message);
            // Revertir estado a pendiente para que Stripe reintente
            await PagoSession.update(
                { estado: 'pendiente' },
                { where: { stripeSessionId: session.id, estado: 'procesando' } }
            ).catch(() => {});
        }
    }

    res.json({ received: true });
};

/**
 * Crea una sesión de pago unificada para la app móvil
 */
const crearSesionPagoUnificada = async (req, res = response) => {
    if (!stripe || !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_placeholder') {
        return res.status(503).json({
            msg: 'El sistema de pagos no está configurado. Por favor, contacta al administrador.'
        });
    }

    try {
        const {
            asientoId,
            dni,
            tipo = 'abono',
            partidoId,
            email,
            nombre
        } = req.body;

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
            return res.status(400).json({ msg: 'El asiento no está disponible.' });
        }

        const precio = Number(asiento.Sector.precio);
        const montoCentavos = Math.round(precio * 100);

        const sessionParams = {
            payment_method_types: ['card'],
            billing_address_collection: 'auto',
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: tipo === 'abono' ? `Abono de Temporada - Algeciras CF` : `Entrada - Algeciras CF`,
                            description: `Sector ${asiento.Sector.nombre} - Fila ${asiento.fila}, Butaca ${asiento.numero}`,
                        },
                        unit_amount: montoCentavos,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.BACKEND_URL || 'https://backend-algeciras.hawkins.es'}/api/pagos/pago-exitoso?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.BACKEND_URL || 'https://backend-algeciras.hawkins.es'}/api/pagos/pago-cancelado`,
            metadata: {
                tipo,
                asientoId: String(asientoId),
                dni,
                ...(partidoId ? { partidoId: String(partidoId) } : {})
            }
        };

        if (email) {
            sessionParams.customer_email = email;
        }

        const session = await stripe.checkout.sessions.create(sessionParams);

        const fechaExpiracion = new Date();
        fechaExpiracion.setMinutes(fechaExpiracion.getMinutes() + 30);

        await PagoSession.create({
            stripeSessionId: session.id,
            tipo,
            estado: 'pendiente',
            datosCompra: { asientoId, dni, email, nombre, tipo, partidoId },
            monto: precio,
            fechaExpiracion
        });

        res.json({ sessionId: session.id, url: session.url });

    } catch (error) {
        console.error('Error al crear sesión de pago unificada:', error);
        res.status(500).json({
            msg: 'Error al crear la sesión de pago',
            error: error.message
        });
    }
};

const estadoPago = async (req, res = response) => {
    const { session_id } = req.query;
    if (!session_id) return res.status(400).json({ msg: 'session_id requerido' });
    try {
        const pagoSession = await PagoSession.findOne({ where: { stripeSessionId: session_id } });
        if (!pagoSession) return res.status(404).json({ msg: 'Sesión no encontrada' });
        return res.json({
            estado: pagoSession.estado,
            tipo: pagoSession.tipo,
            completado: pagoSession.estado === 'completado'
        });
    } catch (error) {
        return res.status(500).json({ msg: 'Error al consultar estado' });
    }
};

const paginaPagoExitoso = (req, res) => {
    res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Pago exitoso</title>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <style>body{font-family:sans-serif;text-align:center;padding:40px;background:#f5f5f5}
    .card{background:#fff;border-radius:12px;padding:32px;max-width:400px;margin:0 auto;box-shadow:0 2px 8px rgba(0,0,0,.1)}
    h1{color:#C8102E}p{color:#555}.icon{font-size:64px}</style></head>
    <body><div class="card"><div class="icon">✅</div>
    <h1>¡Pago completado!</h1>
    <p>Tu abono ha sido procesado correctamente.</p>
    <p>Recibirás un email de confirmación en breve.</p>
    <p style="margin-top:24px;font-size:13px;color:#999">Puedes cerrar esta ventana y volver a la app.</p>
    </div></body></html>`);
};

const paginaPagoCancelado = (req, res) => {
    res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Pago cancelado</title>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <style>body{font-family:sans-serif;text-align:center;padding:40px;background:#f5f5f5}
    .card{background:#fff;border-radius:12px;padding:32px;max-width:400px;margin:0 auto;box-shadow:0 2px 8px rgba(0,0,0,.1)}
    h1{color:#C8102E}p{color:#555}.icon{font-size:64px}</style></head>
    <body><div class="card"><div class="icon">❌</div>
    <h1>Pago cancelado</h1>
    <p>No se ha realizado ningún cargo.</p>
    <p>Puedes cerrar esta ventana y volver a la app para intentarlo de nuevo.</p>
    </div></body></html>`);
};

module.exports = {
    crearSesionPagoEntrada,
    crearSesionPagoAbono,
    confirmarPago,
    webhookStripe,
    crearSesionPagoUnificada,
    estadoPago,
    paginaPagoExitoso,
    paginaPagoCancelado
};
