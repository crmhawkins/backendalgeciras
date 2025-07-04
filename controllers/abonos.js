const { validationResult } = require('express-validator');
const Abono = require('../models/abono');
const Usuario = require('../models/usuario');
const Asiento = require('../models/asiento');
const Sector = require('../models/sector');
const Entrada = require('../models/entrada');
const Partido = require('../models/partido');
const bcryptjs = require('bcryptjs');
const nodemailer = require('nodemailer');
const generarPasswordAleatoria = require('../helpers/generarPasswordAleatoria');

const {actualizarJSONAsiento} = require('../services/updateJSON');


const abonoPost = async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json(errors);
    }

    try {
        const {
            fechaInicio,
            fechaFin,
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
            codigoPostal,
            asientoId,
        } = req.body;

        const asiento = await Asiento.findByPk(asientoId, {
            include: {
                model: Sector,
                attributes: ['precio']
            }
        });

        if (!asiento || asiento.estado === 'ocupado') {
            return res.status(400).json({ msg: 'El asiento no está disponible' });
        }

        const sector = asiento.Sector;
        if (!sector) {
            return res.status(400).json({ msg: 'No se pudo determinar el sector del asiento' });
        }

        let usuario = await Usuario.findOne({ where: { email } });

        let nuevaCuenta = false;
        let passwordPlano = '';

        if (!usuario) {
            passwordPlano = generarPasswordAleatoria(10);
            const salt = bcryptjs.genSaltSync();
            const hashedPassword = bcryptjs.hashSync(passwordPlano, salt);

            try {
                usuario = await Usuario.create({
                    nombre,
                    email,
                    profileImage: 'default_profile_photo.png',
                    password: hashedPassword,
                    dni
                });
                nuevaCuenta = true;
            } catch (e) {
                return res.status(500).json({ msg: "Error al crear el usuario", error: e });
            }
        }

        const hoy = new Date();
        const { Op } = require("sequelize");

        const entradaFutura = await Entrada.findOne({
            where: { asientoId },
            include: [{
                model: Partido,
                where: {
                    fecha: { [Op.gte]: hoy }
                }
            }]
        });

        if (entradaFutura) {
            return res.status(400).json({
                msg: 'Este asiento ya tiene una entrada comprada para un partido futuro. No se puede asignar un abono.'
            });
        }

        const abono = await Abono.create({
            fechaInicio,
            fechaFin,
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
            codigoPostal,
            usuarioId: usuario.id,
            asientoId,
            precio: sector.precio
        });

        asiento.estado = 'ocupado';

        await asiento.save();

        actualizarJSONAsiento(asientoId, 'ocupado');

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
            subject: 'Abono confirmado - Algeciras CF',
            html: `
                <h2>¡Gracias por adquirir tu abono!</h2>
                <p><strong>Nombre:</strong> ${nombre} ${apellidos}</p>
                <p><strong>Zona:</strong> Sector ${sector.nombre} (ID= ${asiento.sectorId}) - Fila ${asiento.fila}, Butaca ${asiento.numero}</p>
                <p><strong>Email de acceso:</strong> ${email}</p>
                ${nuevaCuenta ? `<p><strong>Contraseña generada:</strong> ${passwordPlano}</p>` : ''}
                <p><strong>Código de abono:</strong> ${abono.id}</p>
                <p><strong>Precio del abono:</strong> ${sector.precio} €</p>
                <hr/>
                <p>⚽ Algeciras CF</p>
            `
        });

        res.status(201).json({ msg: 'Abono creado correctamente', abono });

    } catch (error) {
        res.status(500).json({ msg: 'Error al crear el abono', error });
    }
};


const abonoGet = async (req, res) => {
    try {
        const abonos = await Abono.findAll();
        res.json({ abonos });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al obtener los abonos' });
    }
};

const renovarAbono = async (req, res) => {
    const { dni, codigo } = req.body;

    try {
        const usuario = await Usuario.findOne({ where: { dni } });

        if (!usuario) {
            return res.status(404).json({ msg: 'Usuario no encontrado con ese DNI' });
        }

        const abono = await Abono.findByPk(codigo, {
            include: [Asiento]
        });

        if (!abono || abono.usuarioId !== usuario.id) {
            return res.status(404).json({ msg: 'Abono no encontrado para ese usuario' });
        }

        const fechaInicio = new Date();
        const fechaFin = new Date();
        fechaFin.setFullYear(fechaInicio.getFullYear() + 1);
        abono.fechaInicio = fechaInicio;
        abono.fechaFin = fechaFin;
        abono.activo = true;

        // const fechaLimite = new Date('2025-08-31');
        // if (fechaInicio > fechaLimite) {
        //     return res.status(403).json({ msg: 'El período de renovación ha terminado.' });
        // }

        await abono.save();

        res.json({ msg: 'Abono renovado correctamente', abono });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al renovar el abono' });
    }
};

const getAbonosPorUsuario = async (req, res) => {
    const { id } = req.params;

    try {
        const abonos = await Abono.findAll({
            where: { usuarioId: id },
            include: {
                model: Asiento,
                include: {
                    model: Sector,
                    attributes: ['nombre', 'precio']
                }
            }
        });

        res.json({ abonos });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al obtener los abonos del usuario' });
    }
};

const liberarAsiento = async (req, res) => {
    const { usuarioId, asientoId, partidoId } = req.body;

    try {
        const abono = await Abono.findOne({
            where: { usuarioId, asientoId },
            include: {
                model: Asiento,
                include: {
                    model: Sector,
                    attributes: ['precio']
                }
            }
        });

        if (!abono) {
            return res.status(404).json({ msg: 'No se encontró un abono para ese asiento y usuario' });
        }

        const partido = await Partido.findByPk(partidoId);
        if (!partido) {
            return res.status(404).json({ msg: 'Partido no encontrado' });
        }

        const yaExiste = await Entrada.findOne({
            where: { partidoId, asientoId }
        });

        if (yaExiste) {
            return res.status(400).json({ msg: 'Ese asiento ya fue liberado para este partido' });
        }

        if (!abono.Asiento || !abono.Asiento.sectorId) {
            return res.status(400).json({ msg: 'Información del asiento incompleta' });
        }

        await Entrada.create({
            usuarioId: 1,
            partidoId,
            asientoId,
            precio: abono.Asiento.Sector.precio
        });

        res.json({ msg: 'Asiento liberado correctamente para ese partido' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al liberar asiento' });
    }
};

const cancelarLiberacionAsiento = async (req, res) => {
    const { usuarioId, asientoId, partidoId } = req.body;

    try {
        const abono = await Abono.findOne({
            where: { usuarioId, asientoId }
        });

        if (!abono) {
            return res.status(404).json({ msg: 'No se encontró un abono para este usuario y asiento.' });
        }

        const entradaLiberada = await Entrada.findOne({
            where: {
                partidoId,
                asientoId
            }
        });

        if (!entradaLiberada) {
            return res.status(404).json({ msg: 'No se encontró entrada liberada para cancelar.' });
        }

        if (entradaLiberada.usuarioId !== 1) {
            return res.status(400).json({ msg: 'Ya se compró esta entrada, no se puede cancelar la liberación.' });
        }

        await entradaLiberada.destroy();

        return res.json({ msg: 'Liberación de asiento cancelada correctamente.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al cancelar la liberación del asiento.' });
    }
};

module.exports = {
    abonoGet,
    abonoPost,
    renovarAbono,
    getAbonosPorUsuario,
    liberarAsiento,
    cancelarLiberacionAsiento
};
