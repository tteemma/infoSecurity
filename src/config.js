const path = require('node:path');
require('dotenv').config({ quiet: true });

function getConfig(overrides = {}) {
  return {
    port: Number(process.env.PORT || 3000),
    databasePath: process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'app.db'),
    demoLogin: process.env.DEMO_LOGIN || 'student',
    demoPassword: process.env.DEMO_PASSWORD || 'ChangeMe123!',
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
    ...overrides,
  };
}

module.exports = { getConfig };
