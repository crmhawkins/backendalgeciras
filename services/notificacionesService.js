const { Expo } = require('expo-server-sdk');
const nodemailer = require('nodemailer');
const { db } = require('../database/config');

const expo = new Expo();

function getTransporter() {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT),
        secure: process.env.EMAIL_ENCRYPTION === 'ssl',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
}

async function enviarCodigoEmail(abono, partido) {
    const transporter = getTransporter();
    await transporter.sendMail({
        from: `"Algeciras CF" <${process.env.EMAIL_USER}>`,
        to: abono.email,
        subject: `Tu código de acceso — ${abono.partido || partido.equipoLocal + ' vs ' + partido.equipoVisitante}`,
        html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:24px;border:1px solid #eee;border-radius:8px">
          <h2 style="color:#C8102E;text-align:center">Algeciras CF</h2>
          <p>Hola <strong>${abono.nombre}</strong>,</p>
          <p>Tu código de acceso para el partido <strong>${partido.equipoLocal} vs ${partido.equipoVisitante}</strong>
          (${partido.fecha ? partido.fecha.toString().substring(0,10) : ''}) es:</p>
          <div style="text-align:center;margin:24px 0">
            <span style="font-size:36px;font-weight:bold;letter-spacing:6px;color:#C8102E;background:#f9f9f9;padding:16px 24px;border-radius:8px;border:2px dashed #C8102E">
              ${abono.codigoAcceso}
            </span>
          </div>
          <p style="color:#666;font-size:13px">Presenta este código en las puertas del estadio. Válido únicamente para este partido.</p>
          <p style="color:#aaa;font-size:11px;text-align:center">Algeciras CF — El Muni</p>
        </div>`,
    });
}

async function enviarCodigoPush(pushToken, abono, partido) {
    if (!Expo.isExpoPushToken(pushToken)) return;
    const messages = [{
        to: pushToken,
        sound: 'default',
        title: 'Tu código para hoy',
        body: `${partido.equipoLocal} vs ${partido.equipoVisitante} — Código: ${abono.codigoAcceso}`,
        data: { codigoAcceso: abono.codigoAcceso, partidoId: partido.id },
    }];
    await expo.sendPushNotificationsAsync(messages);
}

async function procesarNotificaciones() {
    if (process.env.NOTIFICACIONES_ACTIVAS !== 'true') return;

    const ahora = new Date();
    const en6h = new Date(ahora.getTime() + 6 * 60 * 60 * 1000);
    const en5h55m = new Date(ahora.getTime() + (6 * 60 - 5) * 60 * 1000);

    const [partidos] = await db.query(
        `SELECT * FROM partidos WHERE fecha >= ? AND fecha <= ? LIMIT 1`,
        { replacements: [en5h55m, en6h], type: 'SELECT' }
    );

    if (!partidos || partidos.length === 0) return;
    const partido = partidos[0];
    console.log(`[notificaciones] Partido próximo encontrado: ${partido.equipoLocal} vs ${partido.equipoVisitante}`);

    const [abonos] = await db.query(
        `SELECT a.*, u.expoPushToken FROM abonos a
         LEFT JOIN usuarios u ON u.id = a.usuarioId
         WHERE a.activo = 1 AND a.codigoAcceso IS NOT NULL`,
        { type: 'SELECT' }
    );

    for (const abono of abonos) {
        if (abono.email && abono.email.includes('@')) {
            const [ya] = await db.query(
                `SELECT id FROM notificaciones_partidos WHERE abonoId=? AND partidoId=? AND canal='email'`,
                { replacements: [abono.id, partido.id], type: 'SELECT' }
            );
            if (!ya || ya.length === 0) {
                try {
                    await enviarCodigoEmail(abono, partido);
                    await db.query(
                        `INSERT INTO notificaciones_partidos (abonoId, partidoId, enviadoAt, canal) VALUES (?,?,NOW(),'email')`,
                        { replacements: [abono.id, partido.id] }
                    );
                } catch(e) { console.error(`[notificaciones] Email error abono ${abono.id}:`, e.message); }
            }
        }
        if (abono.expoPushToken) {
            const [ya] = await db.query(
                `SELECT id FROM notificaciones_partidos WHERE abonoId=? AND partidoId=? AND canal='push'`,
                { replacements: [abono.id, partido.id], type: 'SELECT' }
            );
            if (!ya || ya.length === 0) {
                try {
                    await enviarCodigoPush(abono.expoPushToken, abono, partido);
                    await db.query(
                        `INSERT INTO notificaciones_partidos (abonoId, partidoId, enviadoAt, canal) VALUES (?,?,NOW(),'push')`,
                        { replacements: [abono.id, partido.id] }
                    );
                } catch(e) { console.error(`[notificaciones] Push error abono ${abono.id}:`, e.message); }
            }
        }
    }
    console.log(`[notificaciones] Ciclo completado para partido ${partido.id}`);
}

module.exports = { procesarNotificaciones };
