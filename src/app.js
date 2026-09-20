const express = require('express');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const { Database } = require('./database');
const { UserRepository } = require('./repositories/user-repository');
const { PostRepository } = require('./repositories/post-repository');
const { AuthService } = require('./services/auth-service');
const { createAuthenticationMiddleware } = require('./middleware/authenticate');
const { safePost } = require('./security/output');
const { validLoginBody, validPostBody } = require('./validation');

async function createApp(config) {
  if (typeof config.jwtSecret !== 'string' || config.jwtSecret.length < 32) {
    throw new Error('JWT_SECRET должен содержать не менее 32 символов');
  }

  const database = new Database(config.databasePath);
  database.initialize();

  const userRepository = new UserRepository(database);
  const postRepository = new PostRepository(database);
  const authService = new AuthService(userRepository, config);
  await authService.ensureUser(config.demoLogin, config.demoPassword);

  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(express.json({ limit: '10kb' }));

  const loginLimiter = rateLimit({
    windowMs: 60_000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Слишком много попыток входа. Повторите позже' },
  });

  app.post('/auth/login', loginLimiter, async (request, response) => {
    if (!validLoginBody(request.body)) {
      return response.status(400).json({ error: 'Некорректные логин или пароль' });
    }

    const { login, password } = request.body;
    const user = await authService.authenticate(login, password);

    if (!user) {
      return response.status(401).json({ error: 'Неверный логин или пароль' });
    }

    return response.json({ token: authService.issueToken(user), user });
  });

  app.use('/api', createAuthenticationMiddleware(authService));

  app.get('/api/data', (_request, response) => {
    response.json({ posts: postRepository.findAll().map(safePost) });
  });

  app.post('/api/posts', (request, response) => {
    if (!validPostBody(request.body)) {
      return response.status(400).json({ error: 'Некорректные title или content' });
    }

    const { title, content } = request.body;
    const post = postRepository.create({ title, content, authorId: request.user.id });
    response.status(201).json({ post: safePost(post) });
  });

  app.use((error, _request, response, _next) => {
    if (error instanceof SyntaxError) {
      return response.status(400).json({ error: 'Некорректный JSON' });
    }

    if (error.status >= 400 && error.status < 500) {
      return response.status(error.status).json({ error: 'Некорректный запрос' });
    }

    console.error(error);
    response.status(500).json({ error: 'Внутренняя ошибка сервера' });
  });

  return { app, database };
}

module.exports = { createApp };
