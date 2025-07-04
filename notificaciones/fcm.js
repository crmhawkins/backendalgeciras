const admin = require('firebase-admin');
const path = require('path');

// Inicializa Firebase Admin con tu clave
const serviceAccount = require(path.join(__dirname, 'tictac-project-firebase-adminsdk-y2maa-290473989b.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const sendNotificationToAll = async (title, body) => {
  const message = {
    notification: {
      title,
      body,
    },
    android: {
        notification: {
          icon: 'icono' // 👈 también aquí, por compatibilidad CAMBIAR RESOLUCIÓN 96x96
        }
      },
    topic: 'todos' // Suscripción general
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('✅ Notificación enviada:', response);
  } catch (error) {
    console.error('❌ Error al enviar la notificación:', error);
  }
};

module.exports = { sendNotificationToAll };
