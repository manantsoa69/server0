const Redis = require("ioredis");

const redisUrl = process.env.NUB_SAVE;
const redisClient = new Redis(redisUrl);

async function getStoredNumbers(number) {
  try {
    let keys = [];

    if (number) {
      keys = await redisClient.keys(number);
    } else {
      keys = await redisClient.keys("*");
    }

    const pipeline = redisClient.pipeline();

    keys.forEach((key) => {
      pipeline.hmget(key, "number", "fbid", "receivedate");
    });

    const results = await pipeline.exec();

    const items = results.map((result) => {
      const [err, values] = result;
      if (err) {
        throw err; // Throw an error if there was an error retrieving data for a key
      }
      const [storedNumber, fbid, receivedate] = values;

      return {
        number: storedNumber,
        fbid,
        receivedate,
      };
    });

    return items;
  } catch (error) {
    // Handle any errors that occur during the Redis operations
    throw error;
  }
}
// Add this function in your redis.js file
async function deleteDataFromRedis(key) {
  try {
    await redisClient.del(key);
    console.log(`Data deleted from Redis for key: ${key}`);
  } catch (error) {
    console.error('Error deleting data from Redis:', error);
    throw error;
  }
}


module.exports = {
  getStoredNumbers,
  deleteDataFromRedis,
};
