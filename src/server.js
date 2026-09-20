const { createApp } = require('./app');
const { getConfig } = require('./config');

async function start() {
  const config = getConfig();
  const { app } = await createApp(config);

  app.listen(config.port, () => {
    console.log(`API запущен: http://localhost:${config.port}`);
  });
}

start().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
