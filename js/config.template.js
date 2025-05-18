// Configuration template
// Copy this file to config.js and replace the placeholder values with your actual credentials

const config = {
  API_BASE_URL: 'https://v2.api.noroff.dev',
  API_KEY: 'YOUR_API_KEY_HERE', // Replace with your Noroff API key
  APP_NAME: 'Auction House',
  APP_ENV: 'development',
};

// Prevent modifications to the config object
Object.freeze(config);

export default config;
