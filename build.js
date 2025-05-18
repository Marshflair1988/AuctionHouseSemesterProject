const fs = require('fs');
const path = require('path');

// Get API key from environment variable or use default for development
const API_KEY =
  process.env.NOROFF_API_KEY || 'aa2b815e-2edb-4047-8ddd-2503d905bff6';

// Create config.js content
const configContent = `// Configuration object - Generated during build
const config = {
  API_BASE_URL: 'https://v2.api.noroff.dev',
  API_KEY: '${API_KEY}',
  APP_NAME: 'Auction House',
  APP_ENV: 'production',
};

// Prevent modifications to the config object
Object.freeze(config);

export default config;
`;

// Write config.js file
const configPath = path.join(__dirname, 'js', 'config.js');
fs.writeFileSync(configPath, configContent);

console.log('config.js has been generated successfully');
