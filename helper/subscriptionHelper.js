//helper/subscriptionHelper.js
const mysql = require('mysql2');
const Redis = require('ioredis');
require('dotenv').config();

// Create a Redis client
const redis = new Redis(process.env.REDIS_URL);

// Connect to the PlanetScale database
const connection = mysql.createConnection(process.env.DATABASE_URL);
console.log('Connected to PlanetScale!');

const checkSubscription = async (fbid) => {
  try {
    console.log('Checking subscription for FBID:', fbid);

    // Check if the FBID exists in the Redis cache
    const cacheItem = await redis.get(fbid);
    if (cacheItem) {
      console.log('Subscription found in cache for FBID:', fbid);

      if (cacheItem === 'E') {
        return {
          subscriptionStatus: 'E',
          expireDate: 'E'
        };
      }

      return {
        subscriptionStatus: 'A',
        expireDate: cacheItem
      };
    }

    // Fetch the subscription from the MySQL database
    const [result] = await connection.promise().query('SELECT * FROM users WHERE fbid = ?', [fbid]);
    const subscriptionItem = result[0];

    if (!subscriptionItem || !subscriptionItem.expireDate) {
      return {
        subscriptionStatus: 'No subscription',
        expireDate: null
      };
    }

    const currentDate = new Date();
    const expireDate = new Date(subscriptionItem.expireDate);

    if (expireDate > currentDate) {
      return {
        subscriptionStatus: 'A',
        expireDate: expireDate.toISOString()
      };
    } else {
      await Promise.all([
        connection.promise().query('UPDATE users SET expireDate = ? WHERE fbid = ?', ['E', fbid]),
        redis.set(fbid, 'E')
      ]);

      return {
        subscriptionStatus: 'E',
        expireDate: 'E'
      };
    }
  } catch (error) {
    console.error('Error occurred while checking subscription:', error);
    return {
      subscriptionStatus: 'Error',
      expireDate: null
    };
  }
};

module.exports = {
  checkSubscription,
};
