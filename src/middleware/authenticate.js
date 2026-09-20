function createAuthenticationMiddleware(authService) {
  return function authenticate(request, response, next) {
    const authorization = request.get('authorization');
    const [scheme, token] = authorization?.split(' ') || [];

    if (scheme !== 'Bearer' || !token) {
      return response.status(401).json({ error: 'Требуется Bearer-токен' });
    }

    try {
      const payload = authService.verifyToken(token);
      request.user = { id: Number(payload.sub), login: payload.login };
      return next();
    } catch {
      return response.status(401).json({ error: 'Токен недействителен или истёк' });
    }
  };
}

module.exports = { createAuthenticationMiddleware };
