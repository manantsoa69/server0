//routes/numberValidation.js
const Redis = require("ioredis");

async function checkNumber(number, senderId) {
  const redisUrl = process.env.NUB_SAVE;
  const redisClient = new Redis(redisUrl);

  if (!/^\d+$/.test(number)) {
    return "Veuillez fournir un numero valide, s'il vous plaît.";
  }

  if (number.length === 10) {
    if (number.startsWith("033") || number.startsWith("034") || number.startsWith("038") || number.startsWith("032")) {
      // Get the current date
      const currentDate = new Date().toISOString();

      // Save number as the key with senderId as value1 and currentDate as value2 in Redis
      await redisClient.hset(number, "number", number, "fbid", senderId, "receivedate", currentDate);

      return "Nous vous prions de bien vouloir patienter pendant que nous traitons et vérifions votre paiement. 🕐 Nous vous remercions pour votre confiance.";
    } else {
      return "Il y a un problème avec votre numéro. Il doit commencer par 033, 034, 038 ou 032.";
    }
  } else if (number.length < 10) {
    return "Veuillez s'il vous plaît fournir un numéro composé exactement de 10 chiffres.";
  } else {
    return "Nous vous prions de bien vouloir vous assurer qu'il ne dépasse pas 10 chiffres.";
  }
}

module.exports = {
  checkNumber,
};