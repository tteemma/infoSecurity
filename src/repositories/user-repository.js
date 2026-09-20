class UserRepository {
  constructor(database) {
    this.database = database;
  }

  findByLogin(login) {
    return this.database.connection
      .prepare('SELECT id, login, password_hash FROM users WHERE login = ?')
      .get(login);
  }

  create(login, passwordHash) {
    const result = this.database.connection
      .prepare('INSERT INTO users (login, password_hash) VALUES (?, ?)')
      .run(login, passwordHash);

    return { id: Number(result.lastInsertRowid), login };
  }
}

module.exports = { UserRepository };
