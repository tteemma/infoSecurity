const path = require('node:path');

function getConfig(overrides = {}) {
  return {
    port: Number(process.env.PORT || 3000),
    databasePath: process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'app.db'),
    demoLogin: process.env.DEMO_LOGIN || 'student',
    demoPassword: process.env.DEMO_PASSWORD || 'ChangeMe123!',
    ...overrides,
  };
}

module.exports = { getConfig };
