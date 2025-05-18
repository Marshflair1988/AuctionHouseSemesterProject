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

// Ensure js directory exists
const jsDir = path.join(__dirname, 'js');
if (!fs.existsSync(jsDir)) {
  fs.mkdirSync(jsDir, { recursive: true });
}

// Write to config.js
const configPath = path.join(jsDir, 'config.js');
try {
  fs.writeFileSync(
    configPath,
    `const config = ${JSON.stringify(
      config,
      null,
      2
    )};\nObject.freeze(config);\nexport default config;`
  );
  console.log('Successfully created config.js');
} catch (error) {
  console.error('Error creating config.js:', error);
  process.exit(1);
}

// Create a .nojekyll file to prevent GitHub Pages from processing the site
try {
  fs.writeFileSync(path.join(__dirname, '.nojekyll'), '');
  console.log('Created .nojekyll file');
} catch (error) {
  console.error('Error creating .nojekyll file:', error);
}
