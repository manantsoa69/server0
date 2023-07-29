//routes/homeRoute.js
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  console.log('GET request received');
  res.sendStatus(200);
});

module.exports = {
  router
};
