class PostRepository {
  constructor(database) {
    this.database = database;
  }

  findAll() {
    return this.database.connection.prepare(`
      SELECT posts.id, posts.title, posts.content, users.login AS author,
             posts.created_at AS createdAt
      FROM posts
      JOIN users ON users.id = posts.author_id
      ORDER BY posts.id
    `).all();
  }

  create({ title, content, authorId }) {
    const result = this.database.connection
      .prepare('INSERT INTO posts (title, content, author_id) VALUES (?, ?, ?)')
      .run(title, content, authorId);

    return this.database.connection.prepare(`
      SELECT posts.id, posts.title, posts.content, users.login AS author,
             posts.created_at AS createdAt
      FROM posts
      JOIN users ON users.id = posts.author_id
      WHERE posts.id = ?
    `).get(result.lastInsertRowid);
  }
}

module.exports = { PostRepository };
