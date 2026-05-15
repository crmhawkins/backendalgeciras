const { response } = require('express');
const { Op } = require('sequelize');
const Waitlist = require('../models/Waitlist');
const Asiento = require('../models/asiento');
const Usuario = require('../models/usuario');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 465,
    secure: process.env.EMAIL_ENCRYPTION === 'ssl',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * POST /api/waitlist
 * Body: { asientoId, partidoId? }
 */
const unirseWaitlist = async (req, res = response) => {
    try {
        const { asientoId, partidoId } = req.body;
        const usuarioId = req.uid;

        if (!asientoId) {
            return res.status(400).json({ msg: 'asientoId es obligatorio' });
        }

        const asiento = await Asiento.findByPk(asientoId);
        if (!asiento) {
            return res.status(404).json({ msg: 'Asiento no encontrado' });
        }

        // Evitar duplicado
        const existente = await Waitlist.findOne({
            where: {
                asientoId,
                usuarioId,
                partidoId: partidoId || null
            }
        });
        if (existente) {
            return res.status(409).json({ msg: 'Ya estás en la waitlist para este asiento' });
        }

        const entrada = await Waitlist.create({
            asientoId,
            usuarioId,
            partidoId: partidoId || null
        });

        return res.status(201).json({ ok: true, waitlist: entrada });
    } catch (error) {
        console.error('[waitlist] Error unirse:', error.message);
        return res.status(500).json({ msg: 'Error al unirse a la waitlist' });
    }
};

/**
 * DELETE /api/waitlist/:asientoId
 */
const salirWaitlist = async (req, res = response) => {
    try {
        const { asientoId } = req.params;
        const usuarioId = req.uid;

        const deleted = await Waitlist.destroy({
            where: { asientoId, usuarioId }
        });

        if (!deleted) {
            return res.status(404).json({ msg: 'No estás en la waitlist para ese asiento' });
        }

        return res.json({ ok: true, msg: 'Eliminado de la waitlist' });
    } catch (error) {
        console.error('[waitlist] Error salir:', error.message);
        return res.status(500).json({ msg: 'Error al salir de la waitlist' });
    }
};

/**
 * GET /api/waitlist
 */
const misWaitlists = async (req, res = response) => {
    try {
        const usuarioId = req.uid;
        const lista = await Waitlist.findAll({
            where: { usuarioId },
            include: [{ model: Asiento }],
            order: [['createdAt', 'ASC']]
        });
        return res.json({ ok: true, waitlists: lista });
    } catch (error) {
        console.error('[waitlist] Error listar:', error.message);
        return res.status(500).json({ msg: 'Error al obtener waitlists' });
    }
};

/**
 * Notifica primer usuario en waitlist cuando asiento queda disponible.
 * Llamar tras cambiar Asiento.estado → 'disponible'
 */
const notificarWaitlist = async (asientoId) => {
    try {
        const entrada = await Waitlist.findOne({
            where: { asientoId, notificado: false },
            include: [{ model: Usuario, attributes: ['id', 'nombre', 'email'] }],
            order: [['createdAt', 'ASC']]
        });

        if (!entrada) return;

        const usuario = entrada.Usuario;
        if (!usuario || !usuario.email) return;

        const checkoutUrl = `${process.env.FRONTEND_URL || 'https://app.algecirascf.com'}/asiento/${asientoId}`;

        if (process.env.NOTIFICACIONES_ACTIVAS !== 'true') { console.warn('[email] NOTIFICACIONES_ACTIVAS no activa'); return; }
        await transporter.sendMail({
            from: `"Algeciras CF" <${process.env.EMAIL_USER}>`,
            to: usuario.email,
            subject: 'Asiento disponible — Algeciras CF',
            html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Asiento disponible</title></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px">
  <div style="max-width:500px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)">
    <div style="background:#DC143C;padding:24px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:20px">🏟️ Algeciras CF</h1>
    </div>
    <div style="padding:28px 32px">
      <p>Hola <strong>${usuario.nombre}</strong>,</p>
      <p>El asiento que solicitaste en la waitlist <strong>ya está disponible</strong>.</p>
      <p style="text-align:center;margin:28px 0">
        <a href="${checkoutUrl}"
           style="background:#DC143C;color:#fff;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:15px">
          Reservar ahora
        </a>
      </p>
      <p style="color:#888;font-size:12px">Este aviso se envía al primer usuario en lista. Si no actúas pronto, el asiento puede ser reservado por otro.</p>
    </div>
  </div>
</body>
</html>`
        });

        entrada.notificado = true;
        await entrada.save();

        console.log(`[waitlist] Notificado usuario ${usuario.id} para asiento ${asientoId}`);
    } catch (err) {
        console.error('[waitlist] Error notificar:', err.message);
    }
};

module.exports = { unirseWaitlist, salirWaitlist, misWaitlists, notificarWaitlist };
