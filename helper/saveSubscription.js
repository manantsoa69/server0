//helper/saveSubscription.js
const axios = require('axios');
const mysql = require('mysql2');
const Redis = require('ioredis');
require('dotenv').config();

// Load environment variables
const {
  REDIS_URL,
  DATABASE_URL,
  EXTERNAL_API_URL
} = process.env;

// Create a Redis client
const redis = new Redis(REDIS_URL);

// Connect to the PlanetScale database
const connection = mysql.createConnection(DATABASE_URL);
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to PlanetScale:', err);
  }
});

const { calculateExpirationDate } = require('../helper/expireDateCalculator');

const saveSubscription = async (fbid, subscriptionStatus) => {
  if (subscriptionStatus === 'A') {
    console.log('Subscription is already active:', subscriptionStatus);
    return true;
  }

  const expireDate = calculateExpirationDate(subscriptionStatus);

  if (!expireDate) {
    return false;
  }

  try {
    console.log('Saving subscription:', subscriptionStatus);

    const cacheKey = `${fbid}`;

    // Update the item in Redis cache
    await redis.set(cacheKey, expireDate.toISOString());

    // Check if the FBID already exists in the MySQL database
    const [existingItem] = await connection.promise().query('SELECT fbid, expireDate FROM users WHERE fbid = ?', [fbid]);
    if (existingItem.length > 0) {
      // Update the expiration date for expired subscriptions in MySQL
      await connection.promise().query('UPDATE users SET expireDate = ? WHERE fbid = ?', [expireDate.toISOString(), fbid]);
      console.log('Subscription updated in MySQL:', subscriptionStatus);
    } else {
      // Insert the new item into the MySQL database
      await connection.promise().query('INSERT INTO users (fbid, expireDate) VALUES (?, ?)', [fbid, expireDate.toISOString()]);
      console.log('Subscription saved in MySQL:', subscriptionStatus);
    }

    // Send a GET request to another server
    const response = await axios.get(EXTERNAL_API_URL);

    console.log('GET request sent to another server:', response.data);

    return true;
  } catch (error) {
    console.error('Error occurred while saving subscription:', error);
    return false;
  }
};

module.exports = {
  saveSubscription,
};
