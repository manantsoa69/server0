//helper/subscriptionHelper.js
const mysql = require('mysql2/promise');
const Redis = require('ioredis');
require('dotenv').config();
const redis = new Redis(process.env.REDIS_URL);
console.log('Redis connection established!');
const pool = mysql.createPool(process.env.DATABASE_URL);
const checkSubscription = async (fbid) => {
  try {
    const cacheItem = await redis.get(fbid);
    if (cacheItem) {
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

    const connection = await pool.getConnection();
    try {
      const [result] = await connection.query('SELECT expireDate FROM users WHERE fbid = ?', [fbid]);
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
          connection.query('UPDATE users SET expireDate = ? WHERE fbid = ?', ['E', fbid]),
          redis.set(fbid, 'E')
        ]);

        return {
          subscriptionStatus: 'E',
          expireDate: 'E'
        };
      }
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error occurred while checking subscription:', error);
    return {
      subscriptionStatus: 'E',
      expireDate: null
    };
  }
};

module.exports = {
  checkSubscription,
  redis,
  pool,
};