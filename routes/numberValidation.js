
//routes/numberValidation.js

function checkNumber(number) {
  if (!/^\d+$/.test(number)) {
    return "Veuillez fournir un nombre valide, s'il vous plaît.";
  }

  if (number.length === 10) {
    if (number.startsWith("033") || number.startsWith("034") || number.startsWith("038") || number.startsWith("032")) {
      return "Nous vous prions de bien vouloir patienter pendant que nous traitons et vérifions votre paiement. 🕐 Nous vous remercions pour votre confiance.";
    } else {
      return "Il y a un problème avec votre numéro. Il doit commencer par 033, 034, 038 ou 032.";
    }
  } else if (number.length < 10) {
    return " veuillez s'il vous plaît fournir un numéro composé exactement de 10 chiffres.";
  } else {
    return " Nous vous prions de bien vouloir vous assurer qu'il ne dépasse pas 10 chiffres.";
  }
}

module.exports = {
  checkNumber,
};
