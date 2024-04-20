const Redis = require('ioredis');
const { createClient } = require('@supabase/supabase-js'); // Import createClient function from supabase library
require('dotenv').config();

// Connect to the second Redis account
const redis = new Redis(process.env.REDIS_URL);
console.log('Connected to Redis');

const { activateSubscription } = require('../helper/activeSub');
const { calculateExpirationDate } = require('../helper/expireDateCalculator');

const saveSubscription = async (fbid, subscriptionStatus, numberToQuery) => {
  try {
    if (subscriptionStatus === 'A') {
      console.log('Subscription is already active:', subscriptionStatus);
      return true;
    }

    const expireDate = calculateExpirationDate(subscriptionStatus);
    if (!expireDate) {
      return false;
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_API_KEY);

    try {
      const { data, error } = await supabase
        .from('chat_responses')
        .update({ fbid, expireDate:expireDate }, { returning: 'minimal' })
        .eq('fbid', fbid);

      if (error) {
        console.error('Error saving data to Supabase:', error.message);
      } else {
        if (data) {
          console.log('Data saved to Supabase:', data);
        } else {
          console.log('Data saved to Supabase.');
        }
      }
    } catch (error) {
      console.error('Error occurred while saving data to Supabase:', error.message);
    }


    // Update the expiration date in Redis as well
    const cacheKey = `${fbid}`;
    const expireDateInSeconds = Math.ceil((expireDate.getTime() - Date.now()) / 1000);
    const formattedValue0 = ''; // Make sure formattedValue0 is appropriately set
    const formattedValue1 = 'Chat';
    const updatePromises = [
      redis.multi()
        .del(cacheKey)
        .rpush(cacheKey, formattedValue1)
        .rpush(cacheKey, formattedValue0)
        .expire(cacheKey, expireDateInSeconds)
        .exec()
    ];

    // Execute both updates simultaneously using Promise.all
    await Promise.all(updatePromises);
    await activateSubscription(fbid, subscriptionStatus, numberToQuery);
    console.log('Subscription expiration date updated in Redis:', subscriptionStatus);

    return true;
  } catch (error) {
    console.error('Error occurred while updating subscription expiration date:', error);
    return false;
  }
};

module.exports = {
  saveSubscription,
};
