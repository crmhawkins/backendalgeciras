const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let messaging = null;

try {
    let serviceAccount = null;

    // Preferir variable de entorno (JSON string) sobre fichero
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else {
        const credPath = path.join(__dirname, 'tictac-project-firebase-adminsdk-y2maa-290473989b.json');
        if (fs.existsSync(credPath)) {
            serviceAccount = require(credPath);
        }
    }

    if (serviceAccount) {
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
        messaging = admin.messaging();
    } else {
        console.warn('[FCM] Credenciales Firebase no encontradas — notificaciones push desactivadas');
        console.warn('[FCM] Configura FIREBASE_SERVICE_ACCOUNT como variable de entorno');
    }
} catch (err) {
    console.warn('[FCM] Firebase init fallido:', err.message, '— notificaciones push desactivadas');
}

const sendNotificationToAll = async (title, body) => {
    if (process.env.NOTIFICACIONES_ACTIVAS !== 'true') {
        console.warn('[FCM] NOTIFICACIONES_ACTIVAS no activa — notificación omitida');
        return;
    }
    if (!messaging) {
        console.warn('[FCM] Firebase no inicializado — notificación omitida');
        return;
    }
    const message = {
        notification: { title, body },
        android: { notification: { icon: 'icono' } },
        topic: 'todos'
    };
    try {
        const response = await messaging.send(message);
        console.log('✅ Notificación enviada:', response);
    } catch (error) {
        console.error('❌ Error al enviar la notificación:', error);
    }
};

module.exports = { sendNotificationToAll };
