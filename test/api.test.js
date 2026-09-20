const { after, before, test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const { createApp } = require('../src/app');
const { getConfig } = require('../src/config');

const credentials = { login: 'student', password: 'ChangeMe123!' };
const testConfig = getConfig({
  databasePath: ':memory:',
  demoLogin: credentials.login,
  demoPassword: credentials.password,
  jwtSecret: 'test-secret-with-at-least-32-characters',
  jwtExpiresIn: '5m',
});

let database;
let server;
let token;

before(async () => {
  const application = await createApp(testConfig);
  database = application.database;
  server = application.app.listen(0, '127.0.0.1');
  await once(server, 'listening');

  const response = await request(server).post('/auth/login').send(credentials);
  token = response.body.token;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  database.close();
});

test('POST /auth/login выдаёт JWT для верных данных', async () => {
  const response = await request(server).post('/auth/login').send(credentials);

  assert.equal(response.status, 200);
  assert.equal(response.body.user.login, credentials.login);
  assert.equal(typeof response.body.token, 'string');
});

test('POST /auth/login отклоняет неверный пароль и SQLi-строку', async () => {
  const wrongPassword = await request(server)
    .post('/auth/login')
    .send({ login: credentials.login, password: 'wrong-password' });
  const injection = await request(server)
    .post('/auth/login')
    .send({ login: "student' OR 1=1 --", password: 'anything' });

  assert.equal(wrongPassword.status, 401);
  assert.equal(injection.status, 401);
});

test('GET /api/data запрещает доступ без JWT', async () => {
  const response = await request(server).get('/api/data');

  assert.equal(response.status, 401);
});

test('GET /api/data отклоняет изменённый JWT', async () => {
  const response = await request(server)
    .get('/api/data')
    .set('Authorization', `Bearer ${token.slice(0, -1)}x`);

  assert.equal(response.status, 401);
});

test('GET /api/data отклоняет просроченный JWT', async () => {
  const expiredToken = jwt.sign(
    { sub: '1', login: credentials.login },
    testConfig.jwtSecret,
    { expiresIn: -1, algorithm: 'HS256' },
  );
  const response = await request(server)
    .get('/api/data')
    .set('Authorization', `Bearer ${expiredToken}`);

  assert.equal(response.status, 401);
});

test('POST /api/posts запрещает доступ без JWT', async () => {
  const response = await request(server)
    .post('/api/posts')
    .send({ title: 'Заголовок', content: 'Текст' });

  assert.equal(response.status, 401);
});

test('API отклоняет JSON больше установленного лимита', async () => {
  const response = await request(server)
    .post('/auth/login')
    .send({ login: 'student', password: 'x'.repeat(11 * 1024) });

  assert.equal(response.status, 413);
});

test('POST /api/posts валидирует тело запроса', async () => {
  const response = await request(server)
    .post('/api/posts')
    .set('Authorization', `Bearer ${token}`)
    .send({ title: '', content: 'Текст' });

  assert.equal(response.status, 400);
});

test('API создаёт пост и экранирует XSS при возврате', async () => {
  const response = await request(server)
    .post('/api/posts')
    .set('Authorization', `Bearer ${token}`)
    .send({ title: '<script>alert(1)</script>', content: '<b>текст</b>' });

  assert.equal(response.status, 201);
  assert.equal(response.body.post.title, '&lt;script&gt;alert(1)&lt;/script&gt;');
  assert.equal(response.body.post.content, '&lt;b&gt;текст&lt;/b&gt;');
});

test('GET /api/data возвращает данные авторизованному пользователю', async () => {
  const response = await request(server)
    .get('/api/data')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.posts.length, 1);
  assert.equal(response.body.posts[0].author, credentials.login);
});

test('пароль хранится как bcrypt-хэш', async () => {
  const row = database.connection
    .prepare('SELECT password_hash FROM users WHERE login = ?')
    .get(credentials.login);

  assert.notEqual(row.password_hash, credentials.password);
  assert.equal(await bcrypt.compare(credentials.password, row.password_hash), true);
});
