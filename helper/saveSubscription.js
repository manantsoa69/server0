//helper/saveSubscription.js
const axios = require('axios');
const mysql = require('mysql2/promise');
const Redis = require('ioredis');
require('dotenv').config();

const getRequestUrl = process.env.API_CHECK;
const redis = new Redis(process.env.REDIS_URL);
const pool = mysql.createPool(process.env.DATABASE_URL);

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
    const expireDateISOString = expireDate.toISOString();

    // Update the item in Redis cache
    await redis.set(cacheKey, expireDateISOString);

    const connection = await pool.getConnection();

    try {
      // Check if the FBID already exists in the MySQL database
      const [existingItem] = await connection.query('SELECT fbid, expireDate FROM users WHERE fbid = ?', [fbid]);

      if (existingItem.length > 0) {
        // Update the expiration date for expired subscriptions in MySQL
        await connection.query('UPDATE users SET expireDate = ? WHERE fbid = ?', [expireDateISOString, fbid]);
        console.log('Subscription updated in MySQL:', subscriptionStatus);
      } else {
        // Insert the new item into the MySQL database
        await connection.query('INSERT INTO users (fbid, expireDate) VALUES (?, ?)', [fbid, expireDateISOString]);
        console.log('Subscription saved in MySQL:', subscriptionStatus);
      }
    } finally {
      connection.release();
    }

    // Send a GET request to another server
    const response = await axios.get(getRequestUrl);

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
