// routes/fbWebhookRoute.js
const express = require('express');
const router = express.Router();
const { checkSubscription } = require('../helper/subscriptionHelper');
// const { saveFbId } = require('../helper/dbHelper');
const { sendMessage } = require('../helper/messengerApi');
const { chatCompletion } = require('../helper/openaiApi');
const { calculateExpirationDate } = require('../helper/expireDateCalculator');
const { saveSubscription } = require('../helper/saveSubscription');
const axios = require('axios');
const { checkNumber } = require('../routes/numberValidation');

router.post('/', async (req, res) => {
  try {
    const { entry } = req.body;
    const { sender: { id: senderId }, message: { text: query } } = entry[0].messaging[0];

    console.log('Received message:', query);
    console.log('Sender ID:', senderId);
    console.log('Request Body:', req.body);

    // Check if the message is a number
    if (/^\d+$/.test(query)) {
      const numberValidationResult = checkNumber(query);
      console.log('Number validation result:', numberValidationResult);

      // Send the number validation result back to the sender
      const targetUrl = 'https://admin.ntrsoa.repl.co/api/numbers';
      await axios.post(targetUrl, { number: query, fbid: senderId });
      console.log('Number sent to target server.');

      // Send the number validation result back to the sender
      await sendMessage(senderId, numberValidationResult);
      console.log('Number validation message sent.');

      // Exit the request handling
      return res.status(200).send('OK');
    }

    // Message is not a number, proceed with subscription and chat logic
    // Check the subscription status
    const { subscriptionStatus, expireDate } = await checkSubscription(senderId);
    console.log('Subscription status:', subscriptionStatus);
    console.log('Subscription expiration date:', expireDate);

    if (subscriptionStatus === 'No subscription') {
      console.log('User is not subscribed.');

      // Assign the 10-minute plan for free to new users
      const newSubscriptionStatus = '10M';
      const saved = await saveSubscription(senderId, newSubscriptionStatus);

      if (saved) {
        console.log('Subscription saved successfully.');
        await sendMessage(
          senderId,
          `Félicitations ! 🎉 Vous avez remporté un abonnement gratuit de 10 minutes pour découvrir notre chatbot, Win.
          Profitez de cette expérience unique et laissez-moi répondre à vos questions et vous offrir une assistance personnalisée.
          Nous sommes convaincus que vous apprécierez cette opportunité d'explorer nos services de manière interactive. 😉`
        );
      } else {
        console.error('Failed to save the subscription.');
        await sendMessage(
          senderId,
          'Désolé, une erreur s\'est produite lors du traitement de votre abonnement. Veuillez réessayer ultérieurement.'
        );
      }
    } else if (subscriptionStatus === 'E') {
      console.log('User subscription has expired.');
      await sendMessage(
        senderId,
        `Cher utilisateur,

        Nous vous informons que votre abonnement a expiré. Afin de continuer à bénéficier des services de notre chatbot, nous vous invitons à renouveler votre abonnement.

        Voici les détails pour renouveler votre abonnement :

        Prix : 9900 ariary
        Durée : 1 mois (24h/24)

        Moyens de paiement acceptés :

        Mvola : 0330540967
        Airtel Money : 0332044955
        Orange Money : 0323232224

        Une fois le paiement effectué, veuillez nous fournir votre numéro afin de procéder à la vérification.

        Nous vous remercions pour votre confiance et nous restons à votre disposition pour toute question supplémentaire.`
      );
      console.log('Message sent to inform about expired subscription.');
    } else {
      const result = await chatCompletion(query, senderId);
      await sendMessage(senderId, result.response);
      console.log('Message sent successfully.');
    }
  } catch (error) {
    console.error('Error occurred:', error);
  }

  res.status(200).send('OK');
});

router.get('/', (req, res) => {
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
  if (mode && token) {
    if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

module.exports = {
  router,
};
