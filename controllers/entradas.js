const { response } = require('express');
const { validationResult } = require('express-validator');
const Entrada = require('../models/entrada');
const Usuario = require('../models/usuario');
const Partido = require('../models/partido');
const Asiento = require('../models/asiento');
const Abono = require('../models/abono');
const bcryptjs = require('bcryptjs');
const generarPasswordAleatoria = require('../helpers/generarPasswordAleatoria');
const nodemailer = require('nodemailer');

const entradaGet = async (req, res = response) => {
    const { id } = req.query;

    try {
        const entradas = await Entrada.findAll({
            where: { usuarioId: id },
            include: [
                {
                    model: Partido
                },
                {
                    model: Asiento,
                    attributes: ['numero', 'fila', 'sectorId']
                }
            ]
        });

        if (!entradas.length) {
            return res.status(404).json({
                msg: `No hay entradas encontradas para el usuario con ID ${id}`
            });
        }

        res.json({
            msg: 'Entrada encontrada',
            entrada
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            msg: 'Error al buscar la entrada',
            error
        });
    }
};

const entradaPost = async (req, res = response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json(errors);
    }

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

    try {
        // Verificar si el asiento existe y su estado
        const asiento = await Asiento.findByPk(asientoId);
        
        if (!asiento) {
            return res.status(400).json({ msg: 'El asiento no existe.' });
        }

        // Verificar si existe una entrada para este partido y asiento
        const existente = await Entrada.findOne({ where: { partidoId, asientoId } });

        if (existente) {
            if (existente.usuarioId === 1) {
                // Es una entrada liberada, se puede comprar
                await existente.destroy();
            } else {
                return res.status(400).json({ msg: 'Este asiento ya está reservado para este partido.' });
            }
        } else {
            // Si no hay entrada existente, verificar si el asiento está ocupado por un abono
            if (asiento.estado === 'ocupado') {
                // Verificar si hay un abono activo para este asiento
                const abonoActivo = await Abono.findOne({
                    where: { 
                        asientoId,
                        activo: true
                    }
                });

                if (abonoActivo) {
                    return res.status(400).json({ 
                        msg: 'Este asiento está ocupado por un abono activo. No se puede comprar una entrada.' 
                    });
                }
            }
        }

        let usuario = await Usuario.findOne({ where: { email } });

        let nuevaCuenta = false;
        let passwordPlano = '';
        if (!usuario) {
            passwordPlano = generarPasswordAleatoria(10);
            const salt = bcryptjs.genSaltSync();
            const hashedPassword = bcryptjs.hashSync(passwordPlano, salt);

            usuario = await Usuario.create({
                nombre,
                email,
                profileImage: 'default_profile_photo.png',
                password: hashedPassword,
                dni
            });

            nuevaCuenta = true;
        } else {
            console.log(`[ENTRADA] Usuario existente con ID: ${usuario.id}`);
        }

        const entrada = await Entrada.create({
            partidoId,
            asientoId,
            precio,
            usuarioId: usuario.id
        });

        // Actualizar el estado del asiento a ocupado si no lo está ya
        if (asiento.estado !== 'ocupado') {
            asiento.estado = 'ocupado';
            await asiento.save();
        }

        if (nuevaCuenta) {
            const partido = await Partido.findByPk(partidoId);
            const asientoDetalle = await Asiento.findByPk(asientoId);

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
                to: email,
                subject: '🎟️ Entrada comprada - Algeciras CF',
                html: `
                    <h2>¡Gracias por tu compra en Algeciras CF!</h2>
                    <p>Te hemos creado una cuenta para que puedas acceder a tu perfil y consultar tus entradas.</p>
                    <p><strong>Email de acceso:</strong> ${email}</p>
                    <p><strong>Contraseña generada:</strong> ${passwordPlano}</p>
                    <hr/>
                    <h3>📅 Detalles de tu entrada:</h3>
                    <p><strong>Partido:</strong> ${partido.equipoLocal} vs ${partido.equipoVisitante}</p>
                    <p><strong>Fecha:</strong> ${new Date(partido.fecha).toLocaleDateString()}</p>
                    <p><strong>Hora:</strong> ${partido.hora || 'Por determinar'}</p>
                    <p><strong>Asiento:</strong> Fila ${asientoDetalle.fila}, Butaca ${asientoDetalle.numero}</p>
                    <p><strong>Precio:</strong> ${precio} €</p>
                    <hr/>
                    <p>⚽ Puedes acceder a tu cuenta desde nuestra web para revisar tus compras o renovar tus entradas.</p>
                    <p><strong>algecirascf.com</strong></p>
                `
            });
        }

        res.status(201).json({
            msg: 'Entrada creada correctamente',
            entrada,
            nuevaCuenta
        });

    } catch (error) {
        res.status(500).json({
            msg: 'Error al crear la entrada',
            error
        });
    }
};


const buscarEntradaLiberada = async (req, res) => {
    const { asientoId, partidoId } = req.query;

    try {
        const entrada = await Entrada.findOne({
            where: {
                asientoId,
                partidoId
            }
        });

        res.json({ entrada });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al buscar la entrada liberada' });
    }
};

module.exports = {
    entradaGet,
    entradaPost,
    buscarEntradaLiberada
};
