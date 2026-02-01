const dotenv = require('dotenv');
const path = require('path');

// Load .env.local from the frontend directory
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const { expo } = require('./app.json');

module.exports = {
  expo: {
    ...expo,
    extra: {
      API_URL: process.env.API_URL || '',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
      REVENUECAT_APPLE_API_KEY: process.env.REVENUECAT_APPLE_API_KEY || '',
      REVENUECAT_GOOGLE_API_KEY: process.env.REVENUECAT_GOOGLE_API_KEY || '',
    },
  },
};
