const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let messaging = null;

try {
    const credPath = path.join(__dirname, 'tictac-project-firebase-adminsdk-y2maa-290473989b.json');
    if (fs.existsSync(credPath)) {
        const serviceAccount = require(credPath);
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
        messaging = admin.messaging();
    } else {
        console.warn('[FCM] Credenciales Firebase no encontradas — notificaciones push desactivadas');
    }
} catch (err) {
    console.warn('[FCM] Firebase init fallido:', err.message, '— notificaciones push desactivadas');
}

const sendNotificationToAll = async (title, body) => {
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
