// index.js
const express = require('express');
const responseTime = require('response-time');
const compression = require('compression'); // Import the compression middleware


require('dotenv').config();
const webApp = express();
const PORT = process.env.PORT || 3000;
const startResponseTimer = (req, res, next) => {
  const start = process.hrtime();
  res.on('finish', () => {
    const end = process.hrtime(start);
    const duration = Math.round((end[0] * 1000) + (end[1] / 1000000));
    console.log(`${duration}ms`);
  });
  next();
};

// Use the compression middleware to enable Gzip compression
webApp.use(compression());

webApp.use(responseTime());
webApp.use(startResponseTimer);
webApp.use(express.urlencoded({ extended: true }));
webApp.use(express.json());

// Load the environment variables for the Production environment
if (process.env.NODE_ENV === 'production') {
  const numCPUs = require('os').cpus().length;

  pm2.connect((err) => {
    if (err) {
      console.error('PM2 connection error:', err.stack || err);
      process.exit(1);
    }

    pm2.start(
      {
        script: 'index.js',
        instances: numCPUs, // Number of instances (cluster mode will use all CPU cores)
        exec_mode: 'cluster', // Run the application in cluster mode
        max_memory_restart: '200M', // Max memory allowed for each instance
      },
      (err) => {
        if (err) {
          console.error('PM2 start error:', err.stack || err);
          pm2.disconnect();
          process.exit(1);
        }

        console.log(`Server is up and running at ${PORT} using PM2 in cluster mode.`);
        pm2.disconnect();
      }
    );
  });
}

// Load other routes and middlewares
const fbWebhookRoute = require('./routes/fbWebhookRoute');
const homeRoute = require('./routes/homeRoute');

webApp.use('/facebook', fbWebhookRoute.router);
webApp.use('/', homeRoute.router);

webApp.listen(PORT, () => {
  console.log(`Server is up and running at ${PORT}`);
});
