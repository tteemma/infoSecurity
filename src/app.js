const express = require('express');
const { Database } = require('./database');
const { UserRepository } = require('./repositories/user-repository');
const { PostRepository } = require('./repositories/post-repository');
const { AuthService } = require('./services/auth-service');

async function createApp(config) {
  const database = new Database(config.databasePath);
  database.initialize();

  const userRepository = new UserRepository(database);
  const postRepository = new PostRepository(database);
  const authService = new AuthService(userRepository);
  const demoUser = await authService.ensureUser(config.demoLogin, config.demoPassword);

  const app = express();
  app.use(express.json({ limit: '10kb' }));

  app.post('/auth/login', async (request, response) => {
    const { login, password } = request.body;
    const user = await authService.authenticate(login, password);

    if (!user) {
      return response.status(401).json({ error: 'Неверный логин или пароль' });
    }

    return response.json({ user });
  });

  app.get('/api/data', (_request, response) => {
    response.json({ posts: postRepository.findAll() });
  });

  app.post('/api/posts', (request, response) => {
    const { title, content } = request.body;
    const post = postRepository.create({ title, content, authorId: demoUser.id });
    response.status(201).json({ post });
  });

  app.use((error, _request, response, _next) => {
    console.error(error);
    response.status(500).json({ error: 'Внутренняя ошибка сервера' });
  });

  return { app, database };
}

module.exports = { createApp };
