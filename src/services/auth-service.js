const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const DUMMY_PASSWORD_HASH = '$2b$12$tUx.dKuZyC5Mi5JEeT49Me5rwX.6iy6AtBgerPk5/WuCVt3W6UFp6';

class AuthService {
  constructor(userRepository, { jwtSecret, jwtExpiresIn }) {
    this.userRepository = userRepository;
    this.jwtSecret = jwtSecret;
    this.jwtExpiresIn = jwtExpiresIn;
  }

  async ensureUser(login, password) {
    const existingUser = this.userRepository.findByLogin(login);
    if (existingUser) return existingUser;

    const passwordHash = await bcrypt.hash(password, 12);
    return this.userRepository.create(login, passwordHash);
  }

  async authenticate(login, password) {
    const user = this.userRepository.findByLogin(login);
    const passwordHash = user?.password_hash || DUMMY_PASSWORD_HASH;
    const passwordMatches = await bcrypt.compare(password, passwordHash);

    if (!user || !passwordMatches) return null;
    return { id: user.id, login: user.login };
  }

  issueToken(user) {
    return jwt.sign(
      { sub: String(user.id), login: user.login },
      this.jwtSecret,
      { expiresIn: this.jwtExpiresIn, algorithm: 'HS256' },
    );
  }

  verifyToken(token) {
    return jwt.verify(token, this.jwtSecret, { algorithms: ['HS256'] });
  }
}

module.exports = { AuthService };
