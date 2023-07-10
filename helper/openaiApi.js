// helper/openaiApi.js

require('dotenv').config();
const { Configuration, OpenAIApi } = require('openai');


const { sendMessage } = require('./messengerApi');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
const chatCompletion = async (prompt, fbid, characterLimit, botName, botDescription) => {


  try {
    console.log('Chat completion request:', { prompt, fbid });

    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'make the answer short with TOP' },
        { role: 'user', content: prompt },

      ],
      max_tokens: characterLimit,
      temperature: 0.5,
      top_p: 0.5,
      n: 1,
      stop: '\n ',
    });

    let content = response.data.choices[0].message.content;

    // Replace "OpenAI" with your bot's information
    const botInfo = 'winbots';
    content = content.replace(/OpenAI/g, botInfo);




    // Check if the response contains a suitable position to add "ly bots"
    const addLyBots = content.toLowerCase().includes('ly');

    // Append "ly bots" to the response if applicable
    if (addLyBots) {
      content += ' ly bots';
    }

    console.log('Chat completion response:', content);

    const usage = response.data.usage;
    console.log('Token usage:', usage);

    return {
      status: 1,
      response: content,
    };
  } catch (error) {
    console.error('Error in chatCompletion:', error);
    return {
      status: 0,
      response: '',
    };
  }
};


module.exports = {
  chatCompletion,
};
