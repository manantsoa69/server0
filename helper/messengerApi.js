//helper/messengerApi.js

const axios = require('axios');
require('dotenv').config();

const TOKEN= process.env.TOKEN;//117915544739471
const PAGE_ID = process.env.PAGE_ID;//EAAUayGv03igBOwITTXZBRzZC5dmkBpEd2J2dUMD4AmE89dxkyPmmDsVBD7cR3zh49lsZBZC8M7QZCss5VV67W0iChtHLozatRZAdrQqPmcS3vhJfrO5zkjmfY6srhrxsmFJIY8hvn8kKADZBed7RBM5pN8D3GdzGthZCoufgIFuIl7pbNrxklpeVDKW541nLOKtj
const TOKEN1 = process.env.TOKENA;//EAAD2FhQLtgUBOxRKSfcIBSUK2OUbtUsVJ5GafwBrZBZCMVWnIpsKiao5Q7MNBadfA3Q3SUGGYgKbyVAz5UZBLaThWTARnZBknQMG4QEZAZCNoAnipKZALar8cPW7ldOkfa45KEvN1gSLY9iOwt81D1Kfax72AGR35SZAAfbsA5bwzJXlEyPSADTlRh2srUvPhIkK
const PAGE_ID1 = process.env.PAGE_IDA;//109636048905344

//client
const sendMessage = async (fbid, message) => {
  try {
    const options = {
      method: 'POST',
      url: `https://graph.facebook.com/v18.0/${PAGE_ID}/messages`,
      params: {
        access_token: TOKEN,
      },
      data: {
        recipient: { id: fbid },
        messaging_type: 'RESPONSE',
        message: { text: message },
      },
    };

    await axios(options);

    console.log('Message sent successfully');
    return 1;
  } catch (error) {
    console.error('Error occurred while sending message:', error);
    return 0;
  }
};

//aduser
const sendMessageA = async (senderId, message) => {
  try {
    const options = {
      method: 'POST',
      url: `https://graph.facebook.com/v18.0/${PAGE_ID1}/messages`,
      params: {
        access_token: TOKEN1,
      },
      data: {
        recipient: { id: senderId },
        messaging_type: 'RESPONSE',
        message: { text: message },
      },
    };

    await axios(options);

    console.log('Message sent successfully');
    return 1;
  } catch (error) {
    console.error('Error  sending message:', error);
    return 0;
  }
};


module.exports = {
  sendMessage,
  sendMessageA
};
