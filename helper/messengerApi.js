//helper/messengerApi.js

const axios = require('axios');
require('dotenv').config();

const TOKEN = process.env.TOKEN;
const PAGE_ID = process.env.PAGE_ID;

const sendMessage = async (senderId, message) => {
  try {
    const options = {
      method: 'POST',
      url: `https://graph.facebook.com/v11.0/${PAGE_ID}/messages`,
      params: {
        access_token: TOKEN,
      },
      data: {
        recipient: { id: senderId },
        messaging_type: 'RESPONSE',
        message: { text: message },
      },
    };

    console.log('Sending message to recipient:', senderId);
    //console.log('Message content:', message);
    console.log('Request options:', options);

    const response = await axios(options);

   // console.log('Message sent successfully');
    return 1;
  } catch (error) {
    console.error('Error occurred while sending message:', error);
    return 0;
  }
};

module.exports = {
  sendMessage,
};
