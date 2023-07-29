// helper/openaiApi.js
require('dotenv').config();
const { Configuration, OpenAIApi } = require('openai');
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
const chatCompletion = async (prompt, fbid, characterLimit) => {

  try {
    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'make the answer short under 239 tokens' },
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

    return {
      status: 1,
      response: content,
    };
  } catch (error) {
    console.error('Error occurred while checking subscription:', error);
    return {
      status: 0,
      response: '',
    };
  }
};


module.exports = {
  chatCompletion,
};