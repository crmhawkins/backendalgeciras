const { validationResult } = require('express-validator');
const crypto = require('crypto');
const Abono = require('../models/abono');
const Usuario = require('../models/usuario');
const Asiento = require('../models/asiento');
const Sector = require('../models/sector');
const Entrada = require('../models/entrada');
const Partido = require('../models/partido');
const bcryptjs = require('bcryptjs');
const nodemailer = require('nodemailer');
const generarPasswordAleatoria = require('../helpers/generarPasswordAleatoria');
const { db } = require('../database/config');

const {actualizarJSONAsiento} = require('../services/updateJSON');

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
                attributes: ['nombre', 'precio']
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

        const codigoAcceso = crypto.randomBytes(4).toString('hex').toUpperCase();

        // FIX-1: atomic CAS transaction — prevents race condition double-booking
        let abono;
        try {
            abono = await db.transaction(async (t) => {
                const [affectedRows] = await Asiento.update(
                    { estado: 'ocupado' },
                    { where: { id: asientoId, estado: 'disponible' }, transaction: t }
                );
                if (affectedRows === 0) {
                    throw new Error('ASIENTO_NO_DISPONIBLE');
                }
                return await Abono.create({
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
                    precio: sector.precio,
                    codigoAcceso
                }, { transaction: t });
            });
        } catch (txError) {
            if (txError.message === 'ASIENTO_NO_DISPONIBLE') {
                return res.status(409).json({ msg: 'El asiento ya no está disponible' });
            }
            throw txError;
        }

        actualizarJSONAsiento(asientoId, 'ocupado');

        try {
            await transporter.sendMail({
                from: `"Algeciras CF" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Abono confirmado - Algeciras CF',
                html: `
                <h2>¡Gracias por adquirir tu abono!</h2>
                <p><strong>Nombre:</strong> ${nombre} ${apellidos}</p>
                <p><strong>Zona:</strong> Sector ${sector.nombre} (ID= ${asiento.sectorId}) - Fila ${asiento.fila}, Butaca ${asiento.numero}</p>
                <p><strong>Email de acceso:</strong> ${email}</p>
                ${nuevaCuenta ? `<p>Puedes acceder a tu cuenta usando el email indicado. Si necesitas establecer contraseña, usa la opción "¿Olvidaste tu contraseña?" en la app.</p>` : ''}
                <p><strong>Código de abono:</strong> ${abono.id}</p>
                <p><strong>Precio del abono:</strong> ${sector.precio} €</p>
                <hr/>
                <p>⚽ Algeciras CF</p>
            `
            });
        } catch (emailErr) {
            console.error('[abonoPost] Email falló (abono creado igualmente):', emailErr.message);
        }

        const { dni: _d, telefono: _t, domicilio: _dom, codigoPostal: _cp, pais: _p, provincia: _pr, localidad: _loc, ...abonoSafe } = abono.get({ plain: true });
        res.status(201).json({ msg: 'Abono creado correctamente', abono: abonoSafe });

    } catch (error) {
        res.status(500).json({ msg: 'Error al crear el abono', error });
    }
};


const abonoGet = async (req, res) => {
    try {
        const { Op } = require('sequelize');
        const page  = Math.max(1, parseInt(req.query.page)  || 1);
        const limit = Math.min(200, parseInt(req.query.limit) || 50);
        const offset = (page - 1) * limit;

        const where = {};
        if (req.query.activo !== undefined) {
            where.activo = req.query.activo === 'true' || req.query.activo === '1';
        }
        if (req.query.sectorId) {
            where['$Asiento.sectorId$'] = parseInt(req.query.sectorId);
        }

        const { count, rows } = await Abono.findAndCountAll({
            where,
            limit,
            offset,
            include: [
                {
                    model: Asiento,
                    include: [{ model: Sector }]
                },
                {
                    model: Usuario,
                    attributes: ['nombre', 'email']
                }
            ],
            subQuery: false,
            distinct: true
        });

        res.json({
            data: rows,
            total: count,
            page,
            totalPages: Math.ceil(count / limit)
        });
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

        // FIX-10: IDOR — verify abono belongs to JWT user
        if (abono.usuarioId !== req.uid) {
            return res.status(403).json({ msg: 'No autorizado' });
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

    // Ownership check: user can only see their own abonos
    if (String(req.uid) !== String(id)) {
        return res.status(403).json({ msg: 'No autorizado para ver los abonos de otro usuario' });
    }

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

        res.json(abonos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al obtener los abonos del usuario' });
    }
};

const liberarAsiento = async (req, res) => {
    const usuarioId = req.uid;
    const { asientoId, partidoId } = req.body;

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

        const tokenUnico = crypto.randomBytes(16).toString('hex');
        const codigoAcc = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 4) + '-' + crypto.randomBytes(3).toString('hex').toUpperCase();

        await Entrada.create({
            token: tokenUnico,
            qrCode: tokenUnico,
            codigoAcceso: codigoAcc,
            estado: 'valida',
            tipo: 'taquilla',
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
    const usuarioId = req.uid;
    const { asientoId, partidoId } = req.body;

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
