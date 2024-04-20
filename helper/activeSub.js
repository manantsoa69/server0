const dayjs = require('dayjs');
const utcPlugin = require('dayjs/plugin/utc');
const frLocale = require('dayjs/locale/fr');
const timezonePlugin = require('dayjs/plugin/timezone');
const { calculateExpirationDate } = require('../helper/expireDateCalculator');
const { sendMessage, sendMessageA } = require('../helper/messengerApi');
const adminId = '7270527082962896';

dayjs.extend(utcPlugin);
dayjs.extend(timezonePlugin);
dayjs.locale(frLocale);

async function activateSubscription(fbid, subscriptionStatus, paymentNumber) {
  try {
    const expireDate = calculateExpirationDate(subscriptionStatus);
    if (!expireDate) {
      return false;
    }

    console.log('Received subscription request:', { fbid, subscriptionStatus, paymentNumber });

    // Determine the subscription type and set function accordingly
    const T = subscriptionStatus;
    const A = dayjs().utcOffset('+03:00').format('D MMMM YYYY, HH:mm:ss');
    const E = dayjs(expireDate).utcOffset('+03:00').format('D MMMM YYYY, HH:mm:ss');

    // Simulate successful subscription activation
    const success = true;

    if (success) {
      console.log('Subscription activated successfully.');

      // Send confirmation message to the user
      const messageParts = [
        `Félicitations ! 🎉 Votre abonnement a été activé avec succès. Nous sommes ravis de vous présenter les détails de votre souscription 😊:`,
        '',
        `   Durée: ${T} ✨   `,
        `   Date d'activation: ${A} ⏳   `,
        `   Date d'expiration: ${E} ⌛   `,
        `   Num : ${paymentNumber}`,
        '',
        `Nous espérons que vous apprécierez pleinement les avantages et les fonctionnalités offertes par votre abonnement 🚀. Si vous avez des questions ou des préoccupations, n'hésitez pas à nous contacter 📞. Merci encore pour votre souscription et nous vous souhaitons une excellente expérience 🌟!`
      ];
      const message = messageParts.join('\n');
      await sendMessage(fbid, message);

      // Format admin message
      const adminMessageParts = [
        `Nouvelle souscription activée :`,
        `   Num : ${paymentNumber}`,
        `   ID  : ${fbid} `,
        `   Type : ${T} ✨   `,
        `   Début : ${A} ⏳   `,
        `   Fin : ${E} ⌛   `
      ];
      const adminMessage = adminMessageParts.join('\n');
      await sendMessageA(adminId, adminMessage);

      return { message: 'Subscription activated successfully.' };
    } else {
      console.error('Failed to activate subscription.');
      throw new Error('Failed to activate subscription.');
    }
  } catch (error) {
    console.error('Error subscribing user:', error);
    throw new Error('Error subscribing user.');
  }
}

module.exports = {
  activateSubscription,
};
