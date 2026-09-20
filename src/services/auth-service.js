const bcrypt = require('bcryptjs');

class AuthService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async ensureUser(login, password) {
    const existingUser = this.userRepository.findByLogin(login);
    if (existingUser) return existingUser;

    const passwordHash = await bcrypt.hash(password, 12);
    return this.userRepository.create(login, passwordHash);
  }

  async authenticate(login, password) {
    const user = this.userRepository.findByLogin(login);
    if (!user) return null;

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    return passwordMatches ? { id: user.id, login: user.login } : null;
  }
}

module.exports = { AuthService };
