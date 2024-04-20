const express = require('express');
const path = require('path');
const Redis = require('ioredis');
const dotenv = require('dotenv');
dotenv.config();
const { getStoredNumbers } = require('./redis');

const homeRoute = require('./routes/homeRoute');

const webApp = express();
const PORT = process.env.PORT || 3000;

// Redis Setup
const redisUrl = process.env.NUB_SAVE || '';
const redisClient = new Redis(redisUrl);
redisClient.on('connect', () => console.log('Connected to upstash'));
redisClient.on('error', error => console.error('Error connecting to Redis:', error));


webApp.use(express.static(path.join(__dirname, 'public')));
webApp.use(express.urlencoded({ extended: true }));
webApp.use(express.json());



// Error Handling Middleware
webApp.use((err, req, res, next) => {
  console.error('An error occurred:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

const fbWebhookRoute = require('./routes/fbWebhookRoute');
webApp.use('/facebook', fbWebhookRoute.router);
webApp.use('/subscribe', homeRoute.router);

// Query Route
webApp.get('/query', async (req, res) => {
  try {
    const numberToQuery = req.query.number || '';

    // Assuming the getStoredNumbers() function returns an array of items from Redis
    const items = await getStoredNumbers(numberToQuery);

    // Delete the data from Redis after querying
    await Promise.all(
      items.map(async (item) => {
        const key = item.number; // Assuming the "number" field is used as the Redis key
        await redisClient.del(key);
      })
    );

    res.json({ numberToQuery, items });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// Start the Server
webApp.listen(PORT, () => {
  console.log(`Server is up and running at ${PORT}`);
});
