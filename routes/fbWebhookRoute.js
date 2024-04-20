const express = require('express');
const axios = require('axios');
const router = express.Router();
const { getStoredNumbers, deleteDataFromRedis } = require('../redis');
const { sendMessageA } = require('../helper/messengerApi');
const { saveSubscription } = require('../helper/saveSubscription');
const { activateSubscription } = require('../helper/activeSub');

router.post('/', async (req, res) => {
  try {
    const { entry } = req.body;

    if (entry && entry.length > 0 && entry[0].messaging && entry[0].messaging.length > 0) {
      const { sender: { id: senderId }, message } = entry[0].messaging[0];

      if (message && message.text) {
        let { text: query } = message;
        console.log(`Received message from senderId: ${senderId}`);

        if (query.toLowerCase().startsWith('03')) {
          let numberToQuery = query;

          const items = await getStoredNumbers(numberToQuery);
          console.log(`Result: ${items}`);

          if (items.length === 0) {
            await sendMessageA(senderId, 'No matching data found for the specified number.');
          } else {
            const firstItem = items[0];
            const { number, fbid, receivedate } = firstItem;

            // Send response message
            let responseMessage = `Query result for number ${number}:\n`;
            responseMessage += `FB ID: ${fbid}\n`;
            responseMessage += `Received Date: ${receivedate}\n`;

            await sendMessageA(senderId, responseMessage);
            await sendMessageA(senderId, `sub ${fbid} 1M ${numberToQuery}`);
            await sendMessageA(senderId, `sub ${fbid} 1W ${numberToQuery}`);

            // Call the Redis delete function after data is saved
            await deleteDataFromRedis(numberToQuery);
          }
        } else if (query.toLowerCase().startsWith('sub')) {
          const [_, fbid, subscriptionStatus, paymentNumber ] = query.split(' ');

   

          try {
            const resut = await saveSubscription (fbid, subscriptionStatus, paymentNumber );
            console.log(resut);
            await sendMessageA(senderId, 'Subscribed successfully!');
          } catch (error) {
            console.error('Error subscribing user:', error);
            await sendMessageA(senderId, 'Failed to subscribe.');
          }
        }
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Error handling Facebook webhook:', error);
    res.sendStatus(500);
  }
});

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
