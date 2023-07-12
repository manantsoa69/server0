//index.js
require('dotenv').config();
const Redis = require('ioredis');
const express = require('express');
const dayjs = require('dayjs');
const utcPlugin = require('dayjs/plugin/utc');
const timezonePlugin = require('dayjs/plugin/timezone');
const frLocale = require('dayjs/locale/fr');
const responseTime = require('response-time');
const winston = require('winston');

const { saveSubscription } = require('./helper/saveSubscription');
const { sendMessage } = require('./helper/messengerApi');
const { calculateExpirationDate } = require('./helper/expireDateCalculator');

dayjs.extend(utcPlugin);
dayjs.extend(timezonePlugin);
dayjs.locale(frLocale);

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.simple()
  ),
  transports: [new winston.transports.Console()],
});

const webApp = express();
const PORT = process.env.PORT || 3000;

webApp.use(express.urlencoded({ extended: true }));
webApp.use(express.json());

const startResponseTimer = (req, res, next) => {
  const start = process.hrtime();
  res.on('finish', () => {
    const end = process.hrtime(start);
    const duration = Math.round((end[0] * 1000) + (end[1] / 1000000));
    logger.info(`Response time: ${duration}ms`);
  });
  next();
};

const logRequest = (req, res, next) => {
  logger.info(`Path ${req.path} with Method ${req.method}`);
  next();
};

webApp.use(startResponseTimer);
webApp.use(logRequest);

const homeRoute = require('./routes/homeRoute');
const fbWebhookRoute = require('./routes/fbWebhookRoute');
webApp.use('/', homeRoute.router);
webApp.use('/facebook', fbWebhookRoute.router);

webApp.post('/subscribe', async (req, res, next) => {
  try {
    const { fbid, subscriptionStatus } = req.body;

    logger.info('Received subscription request:', { fbid, subscriptionStatus });

    const startDate = dayjs().utcOffset('+03:00').format('D MMMM YYYY, HH:mm:ss');

    const expireDate = calculateExpirationDate(subscriptionStatus);

    const success = await saveSubscription(fbid, subscriptionStatus);

    if (success) {
      logger.info('Subscription activated successfully.');
      res.status(200).json({ message: 'Subscription activated successfully.' });

      const madagascarTime = dayjs(expireDate).utcOffset('+03:00').format('D MMMM YYYY, HH:mm:ss');

      const messageParts = [
        'Félicitations ! 🎉 Votre abonnement a été activé avec succés. Nous sommes ravis de vous présenter les détails de votre souscription :',
        `Type d'abonnement: ${subscriptionStatus}`,
        `Date d'activation: ${startDate}`,
        `Date d'expiration: ${madagascarTime}`,
        `Nous espérons que vous apprécierez pleinement les avantages et les fonctionnalités offerts par votre abonnement. Si vous avez des questions ou des préoccupations, n'hésitez pas à nous contacter. Merci encore pour votre souscription et nous vous souhaitons une excellente expérience ✨!`
      ];
      const message = messageParts.join('\n');

      await sendMessage(fbid, message);
    } else {
      logger.error('Failed to activate subscription.');
      res.status(500).json({ message: 'Failed to activate subscription.' });
    }
  } catch (error) {
    logger.error('Error subscribing user:', error);
    next(error);
  }
});

webApp.post('/send_message', async (req, res, next) => {
  try {
    const { fbid, message = 'Try again' } = req.body;

    logger.info('Received message request:', { fbid, message });

    const success = await sendMessage(fbid, message);

    if (success) {
      logger.info('Message sent successfully.');
      res.status(200).json({ message: 'Message sent successfully.' });
    } else {
      logger.error('Failed to send message.');
      res.status(500).json({ message: 'Failed to send message.' });
    }
  } catch (error) {
    logger.error('Error sending message:', error);
    next(error);
  }
});

webApp.use((err, req, res, next) => {
  logger.error('An error occurred:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

webApp.listen(PORT, () => {
  logger.info(`Server is up and running at ${PORT}`);
});

