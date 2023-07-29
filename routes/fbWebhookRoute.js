// routes/fbWebhookRoute.js
const express = require('express');
const router = express.Router();
const { saveSubscription } = require('../helper/saveSubscription');
const { checkSubscription } = require('../helper/subscriptionHelper');
const { sendMessage } = require('../helper/messengerApi');
const { chatCompletion } = require('../helper/openaiApi');
const { checkNumber } = require('./numberValidation');

// Handle POST requests for incoming messages
router.post('/', async (req, res) => {
  try {
    const { entry } = req.body;
    const { sender: { id: senderId }, message: { text: query } } = entry[0].messaging[0];
    console.log(`${senderId}`);

    // Check if the message is a number
    if (/^\d+$/.test(query)) {
      const numberValidationResult = await checkNumber(query, senderId);
      await sendMessage(senderId, numberValidationResult);
      console.log('Number message sent:', numberValidationResult);
      return res.sendStatus(200);
    }

    const { subscriptionStatus, expireDate } = await checkSubscription(senderId);
    if (subscriptionStatus === 'No subscription') {
      const newSubscriptionStatus = '10M';
      const saved = await saveSubscription(senderId, newSubscriptionStatus);

      if (saved) {
        console.log('Saved successfully.');
        await sendMessage(
          senderId,
          `Félicitations ! 🎉 Vous avez remporté un abonnement gratuit de 10 minutes pour découvrir notre chatbot, Win.
          
   Profitez de cette expérience unique et laissez-moi répondre à vos questions et vous offrir une assistance personnalisée.😉`
        );
      } else {
        console.log('Failed to save.');
        await sendMessage(
          senderId,
          'Désolé, une erreur s\'est produite lors du traitement de votre abonnement. Veuillez réessayer ultérieurement.'
        );
      }
    } else if (subscriptionStatus === 'E') {
      await sendMessage(
        senderId,
        `
        📢 Votre abonnement a expiré. Afin de continuer à bénéficier des services de notre chatbot, nous vous invitons à renouveler votre abonnement.

        Détails du renouvellement :
        Prix : 9900 ariary 💰
        Durée : 1 mois (24h/24) ⏰

        Moyens de paiement acceptés :
        Mvola : 0330540967
        Airtel Money : 0332044955
        Orange Money : 0323232224
        (Tous les comptes sont au nom de RAZAFIMANANTSOA Jean Marc.)

        Une fois le paiement effectué, veuillez nous fournir votre numéro (10 chiffres) pour la vérification.📲`
      );
      console.log('Expired subscription.');
    } else {
      const result = await chatCompletion(query, senderId);
      await sendMessage(senderId, result.response);
      console.log('Message sent successfully.');
    }
  } catch (error) {
    console.error('Error occurred:', error);
  }

  res.sendStatus(200);
});


// Handle GET requests for verification
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token && mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

module.exports = {
  router,
};