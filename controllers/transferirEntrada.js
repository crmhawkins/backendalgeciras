const { response } = require('express');
const Entrada = require('../models/entrada');
const Usuario = require('../models/usuario');
const Partido = require('../models/partido');
const Asiento = require('../models/asiento');
const Sector = require('../models/sector');
const generarIdUnico = require('../helpers/generarIdUnico');
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
 * POST /api/entradas/:id/transferir
 * Body: { emailDestinatario }
 */
const transferirEntrada = async (req, res = response) => {
    try {
        const { id } = req.params;
        const { emailDestinatario } = req.body;
        const usuarioId = req.uid;

        if (!emailDestinatario) {
            return res.status(400).json({ msg: 'emailDestinatario es obligatorio' });
        }

        // Buscar entrada con datos relacionados
        const entrada = await Entrada.findByPk(id, {
            include: [
                { model: Partido },
                { model: Asiento, include: [{ model: Sector, attributes: ['nombre'] }] }
            ]
        });

        if (!entrada) {
            return res.status(404).json({ msg: 'Entrada no encontrada' });
        }

        // Verificar pertenencia
        if (String(entrada.usuarioId) !== String(usuarioId)) {
            return res.status(403).json({ msg: 'No tienes permiso para transferir esta entrada' });
        }

        // Entrada no usada
        if (entrada.estado === 'usada') {
            return res.status(400).json({ msg: 'No se puede transferir una entrada ya usada' });
        }

        if (entrada.estado === 'cancelada' || entrada.estado === 'archivada') {
            return res.status(400).json({ msg: 'No se puede transferir una entrada cancelada o archivada' });
        }

        // Buscar remitente
        const remitente = await Usuario.findByPk(usuarioId, { attributes: ['id', 'nombre', 'email'] });
        if (!remitente) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        // No auto-transferencia
        if (remitente.email.toLowerCase() === emailDestinatario.toLowerCase()) {
            return res.status(400).json({ msg: 'No puedes transferir la entrada a ti mismo' });
        }

        // Destinatario debe existir
        const destinatario = await Usuario.findOne({
            where: { email: emailDestinatario.toLowerCase().trim() },
            attributes: ['id', 'nombre', 'email']
        });

        if (!destinatario) {
            return res.status(404).json({ msg: 'No existe ningún usuario con ese email' });
        }

        // Regenerar token/QR para invalidar el viejo
        let nuevoToken = null;
        let intentos = 0;
        do {
            nuevoToken = generarIdUnico();
            const existe = await Entrada.findOne({ where: { token: nuevoToken } });
            if (!existe) break;
            intentos++;
        } while (intentos < 10);

        if (!nuevoToken) {
            return res.status(500).json({ msg: 'No se pudo generar token único' });
        }

        const tokenAnterior = entrada.token;

        // Transferir
        entrada.usuarioId = destinatario.id;
        entrada.token = nuevoToken;
        entrada.qrCode = nuevoToken;
        entrada.codigoAcceso = nuevoToken;
        await entrada.save();

        const partido = entrada.Partido;
        const asiento = entrada.Asiento;
        const sectorNombre = asiento?.Sector?.nombre || 'N/A';
        const fechaPartido = partido?.fecha
            ? new Date(partido.fecha).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
            : 'Próximo partido';

        // Email destinatario con nuevo QR
        if (process.env.NOTIFICACIONES_ACTIVAS !== 'true') { console.warn('[email] NOTIFICACIONES_ACTIVAS no activa'); return; }
        await transporter.sendMail({
            from: `"Algeciras CF" <${process.env.EMAIL_USER}>`,
            to: destinatario.email,
            subject: `Entrada transferida — ${partido?.equipoLocal} vs ${partido?.equipoVisitante}`,
            html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Entrada recibida</title></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px">
  <div style="max-width:550px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)">
    <div style="background:#DC143C;padding:24px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:20px">🏟️ Algeciras CF — Entrada Recibida</h1>
    </div>
    <div style="padding:28px 32px">
      <p>Hola <strong>${destinatario.nombre}</strong>,</p>
      <p><strong>${remitente.nombre}</strong> te ha transferido una entrada:</p>
      <div style="background:#f9f9f9;border-left:4px solid #DC143C;padding:14px 18px;border-radius:4px;margin:20px 0">
        <p style="margin:0 0 6px;font-weight:bold">${partido?.equipoLocal} vs ${partido?.equipoVisitante}</p>
        <p style="margin:0;color:#555;font-size:14px">📅 ${fechaPartido}</p>
        <p style="margin:6px 0 0;color:#555;font-size:14px">Sector ${sectorNombre} · Fila ${asiento?.fila || 'N/A'} · Asiento ${asiento?.numero || 'N/A'}</p>
      </div>
      <div style="text-align:center;margin:24px 0">
        <p style="font-size:14px;color:#555;margin-bottom:10px">Tu código de acceso:</p>
        <div style="font-family:'Courier New',monospace;font-size:22px;font-weight:bold;letter-spacing:4px;color:#111;background:#fff;border:3px solid #DC143C;display:inline-block;padding:14px 24px;border-radius:8px">${nuevoToken}</div>
        <p style="margin-top:8px;font-size:12px;color:#777">Código de un solo uso — no lo compartas</p>
      </div>
    </div>
    <div style="background:#222;color:#aaa;text-align:center;font-size:12px;padding:16px">
      Algeciras CF &nbsp;·&nbsp; Estadio Municipal El Mirador
    </div>
  </div>
</body>
</html>`
        }).catch(err => console.error('[transferir] Email destinatario falló:', err.message));

        // Email remitente confirmando transferencia
        if (process.env.NOTIFICACIONES_ACTIVAS !== 'true') { console.warn('[email] NOTIFICACIONES_ACTIVAS no activa'); } else
        await transporter.sendMail({
            from: `"Algeciras CF" <${process.env.EMAIL_USER}>`,
            to: remitente.email,
            subject: `Transferencia confirmada — ${partido?.equipoLocal} vs ${partido?.equipoVisitante}`,
            html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Transferencia confirmada</title></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px">
  <div style="max-width:500px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)">
    <div style="background:#DC143C;padding:24px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:20px">🏟️ Algeciras CF</h1>
    </div>
    <div style="padding:28px 32px">
      <p>Hola <strong>${remitente.nombre}</strong>,</p>
      <p>Tu entrada para <strong>${partido?.equipoLocal} vs ${partido?.equipoVisitante}</strong> ha sido transferida correctamente a <strong>${destinatario.nombre}</strong> (${destinatario.email}).</p>
      <p style="color:#888;font-size:13px">El código QR anterior ya no es válido.</p>
    </div>
    <div style="background:#222;color:#aaa;text-align:center;font-size:12px;padding:16px">
      Algeciras CF &nbsp;·&nbsp; Estadio Municipal El Mirador
    </div>
  </div>
</body>
</html>`
        }).catch(err => console.error('[transferir] Email remitente falló:', err.message));

        console.log(`[transferir] Entrada ${id} transferida de usuario ${usuarioId} a ${destinatario.id}`);

        return res.json({
            ok: true,
            msg: `Entrada transferida a ${destinatario.email}`,
            nuevoToken
        });

    } catch (error) {
        console.error('[transferir] Error:', error.message);
        return res.status(500).json({ msg: 'Error al transferir la entrada' });
    }
};

module.exports = { transferirEntrada };
