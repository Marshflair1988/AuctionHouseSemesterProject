const fs = require('fs');
const path = require('path');

// Get API key from environment variable
const apiKey = process.env.NOROFF_API_KEY;

// Create config object
const config = {
  API_BASE_URL: 'https://api.noroff.dev/api/v2',
  API_KEY: apiKey,
  APP_NAME: 'Auction House',
  APP_ENV: apiKey ? 'production' : 'development',
};

// Write to config.js
const configPath = path.join(__dirname, 'js', 'config.js');
fs.writeFileSync(
  configPath,
  `const config = ${JSON.stringify(
    config,
    null,
    2
  )};\nObject.freeze(config);\nexport default config;`
);
