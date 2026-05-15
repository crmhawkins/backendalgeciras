const nodemailer = require('nodemailer');

/**
 * Envía email de entrada con código QR al comprador
 * @param {Object} entrada - instancia Sequelize Entrada
 * @param {Object} partido  - instancia Sequelize Partido
 * @param {Object} asiento  - instancia Sequelize Asiento (con Sector incluido)
 * @param {Object} usuario  - { nombre, email } — puede ser instancia o plain object
 */
async function enviarEmailEntrada(entrada, partido, asiento, usuario) {
    if (process.env.NOTIFICACIONES_ACTIVAS !== 'true') { console.warn('[email] NOTIFICACIONES_ACTIVAS no activa'); return; }
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT) || 465,
        secure: process.env.EMAIL_ENCRYPTION === 'ssl',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const codigo   = entrada.codigoAcceso || entrada.qrCode || entrada.token;
    const nombre   = usuario.nombre || 'Aficionado';
    const email    = usuario.email;

    if (!email) {
        console.warn('[emailEntrada] Sin email, se omite envío para entrada', entrada.id);
        return;
    }

    const fechaPartido = partido.fecha
        ? new Date(partido.fecha).toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
          })
        : 'Próximo partido';

    const horaPartido = partido.hora || '';
    const sectorNombre = asiento?.Sector?.nombre || asiento?.sectorNombre || 'N/A';
    const filaNum      = asiento?.fila   || 'N/A';
    const asientoNum   = asiento?.numero || 'N/A';

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu entrada - Algeciras CF</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,.12); }
    .header { background: #DC143C; padding: 30px 20px; text-align: center; }
    .header img { height: 70px; }
    .header h1 { color: #fff; margin: 15px 0 0; font-size: 22px; }
    .body { padding: 30px 40px; }
    .match { background: #f9f9f9; border-left: 4px solid #DC143C; padding: 15px 20px; border-radius: 4px; margin-bottom: 25px; }
    .match h2 { margin: 0 0 6px; color: #222; font-size: 18px; }
    .match p  { margin: 0; color: #555; font-size: 14px; }
    .seat-info { display: flex; gap: 12px; margin-bottom: 25px; flex-wrap: wrap; }
    .seat-box { flex: 1; min-width: 130px; background: #fef0f3; border: 1px solid #DC143C; border-radius: 6px; padding: 12px 16px; text-align: center; }
    .seat-box .label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: .5px; }
    .seat-box .value { font-size: 18px; font-weight: bold; color: #DC143C; margin-top: 4px; }
    .qr-section { text-align: center; margin: 30px 0; }
    .qr-code { font-family: 'Courier New', monospace; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #111; background: #fff; border: 3px solid #DC143C; display: inline-block; padding: 18px 30px; border-radius: 8px; }
    .qr-label { margin-top: 10px; font-size: 12px; color: #777; }
    .instructions { background: #fffbf0; border: 1px solid #f0c040; border-radius: 6px; padding: 15px 20px; font-size: 13px; color: #555; margin-top: 20px; }
    .instructions ul { margin: 8px 0 0; padding-left: 18px; }
    .instructions li { margin-bottom: 5px; }
    .footer { background: #222; color: #aaa; text-align: center; font-size: 12px; padding: 20px; }
    .footer a { color: #DC143C; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏟️ Algeciras CF — Tu Entrada</h1>
    </div>
    <div class="body">
      <p>Hola <strong>${nombre}</strong>, aquí tienes tu entrada. ¡Disfruta del partido!</p>

      <div class="match">
        <h2>${partido.equipoLocal} vs ${partido.equipoVisitante}</h2>
        <p>📅 ${fechaPartido}${horaPartido ? ' &nbsp;·&nbsp; ⏰ ' + horaPartido : ''}</p>
      </div>

      <div class="seat-info">
        <div class="seat-box">
          <div class="label">Sector</div>
          <div class="value">${sectorNombre}</div>
        </div>
        <div class="seat-box">
          <div class="label">Fila</div>
          <div class="value">${filaNum}</div>
        </div>
        <div class="seat-box">
          <div class="label">Asiento</div>
          <div class="value">${asientoNum}</div>
        </div>
      </div>

      <div class="qr-section">
        <p style="font-size:14px;color:#555;margin-bottom:12px;">Presenta este código en la entrada del estadio:</p>
        <div class="qr-code">${codigo}</div>
        <div class="qr-label">Código de acceso único — no lo compartas</div>
      </div>

      <div class="instructions">
        <strong>Instrucciones de acceso:</strong>
        <ul>
          <li>Muestra este código en la app o impreso al personal del estadio.</li>
          <li>Llega con antelación — puertas abren 60 min antes del partido.</li>
          <li>Si tienes la app de Algeciras CF, el código aparece en "Mis Entradas".</li>
          <li>Código de un solo uso — válido únicamente para este partido.</li>
        </ul>
      </div>
    </div>
    <div class="footer">
      Algeciras CF &nbsp;·&nbsp; Estadio Municipal El Mirador &nbsp;·&nbsp;
      <a href="https://algecirascf.com">algecirascf.com</a>
    </div>
  </div>
</body>
</html>
    `.trim();

    try {
        await transporter.sendMail({
            from: `"Algeciras CF" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `Tu entrada: ${partido.equipoLocal} vs ${partido.equipoVisitante}`,
            html
        });

        // Marcar como enviado
        entrada.enviadoEmail = true;
        await entrada.save();

        console.log(`[emailEntrada] Email enviado a ${email} para entrada ${entrada.id}`);
    } catch (err) {
        console.error('[emailEntrada] Error al enviar email:', err.message);
        // No lanzar — el email falla silenciosamente, entrada ya está creada
    }
}

module.exports = { enviarEmailEntrada };
