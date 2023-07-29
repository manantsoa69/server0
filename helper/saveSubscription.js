//helper/saveSubscription.js
const { redis, pool } = require('../helper/subscriptionHelper');

const saveSubscription = async (fbid, subscriptionStatus) => {
  if (subscriptionStatus === 'A') {
    return true;
  }

  const expireSeconds = 600; // Set expiration time in seconds (e.g., 600 seconds = 10 minutes)

  try {
    console.log('Saving subscription:', subscriptionStatus);

   // const currentDateISOString = new Date().toISOString();
    const expireDateISOString = new Date(Date.now() + expireSeconds * 1000).toISOString();

    const formattedValue = `${expireDateISOString} (Free)`;

    const cacheKey = `${fbid}`;

    // Update the item in Redis cache with expiration time and " (Free)" suffix
    await redis.setex(cacheKey, expireSeconds, formattedValue);

    const connection = await pool.getConnection();

    try {
      // Check if the FBID already exists in the MySQL database
      await connection.query('INSERT INTO users (fbid, expireDate) VALUES (?, ?)', [fbid, expireDateISOString]);

    } finally {
      connection.release();
    }

    return true;
  } catch (error) {
    console.log('Error occurred while saving subscription:', error);
    return false;
  }
};

module.exports = {
  saveSubscription,
};
