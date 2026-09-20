const escapeHtml = require('escape-html');

function safePost(post) {
  return {
    ...post,
    title: escapeHtml(post.title),
    content: escapeHtml(post.content),
    author: escapeHtml(post.author),
  };
}

module.exports = { safePost };
