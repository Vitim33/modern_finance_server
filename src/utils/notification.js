const { admin } = require('../config/firebase');

async function sendPushNotification({ token, title, body, data = {} }) {
  try {
    const message = {
      token,
      notification: {
        title,
        body,
      },
      data,
    };

    await admin.messaging().send(message);
    console.log('Push enviado com sucesso');
  } catch (error) {
    console.error('Erro ao enviar push:', error);
  }
}

module.exports = {
  sendPushNotification,
};