const { verifyToken } = require('../config/jwt');
const pool = require('../config/database');

/**
 * Middleware de autenticación
 * Verifica el token JWT y adjunta el usuario a req.user
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticación requerido'
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    // Obtener usuario de la base de datos
    const [users] = await pool.query(
      'SELECT id, email, display_name, photo_url, is_moderator FROM users WHERE id = ?',
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    req.user = users[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
    next(error);
  }
}

/**
 * Middleware opcional de autenticación
 * Si hay token, lo valida y adjunta el usuario
 * Si no hay token, continúa sin usuario
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    const [users] = await pool.query(
      'SELECT id, email, display_name, photo_url, is_moderator FROM users WHERE id = ?',
      [decoded.id]
    );

    if (users.length > 0) {
      req.user = users[0];
    }

    next();
  } catch {
    // Si el token es inválido, continuamos sin usuario
    next();
  }
}

/**
 * Middleware que requiere que el usuario sea moderador
 */
function requireModerator(req, res, next) {
  if (!req.user || !req.user.is_moderator) {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren permisos de moderador'
    });
  }
  next();
}

module.exports = {
  authenticate,
  optionalAuth,
  requireModerator
};
