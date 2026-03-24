const { admin } = require("../config/firebase");

async function sendPushNotification({ token, title, body, data = {} }) {
  try {
    const message = {
      token: token,

      notification: {
        title: title,
        body: body,
      },

      data: data,

      android: {
        priority: "high",
        notification: {
          channelId: "high_importance_channel",
        },
      },
    };

    const response = await admin.messaging().send(message);

    console.log("✅ Push enviado:", response);
  } catch (error) {
    console.error("❌ Erro ao enviar push:", error);
  }
}

module.exports = {
  sendPushNotification,
};