/**
 * Middleware centralizado de manejo de errores
 */
function errorHandler(err, req, res, _next) {
  console.error('Error:', err);

  // Error de validación de express-validator
  if (err.array && typeof err.array === 'function') {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: err.array()
    });
  }

  // Error de MySQL
  if (err.code && err.code.startsWith('ER_')) {
    let message = 'Error de base de datos';
    
    if (err.code === 'ER_DUP_ENTRY') {
      message = 'El registro ya existe';
    } else if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      message = 'Referencia a un registro inexistente';
    }

    return res.status(400).json({
      success: false,
      message,
      code: err.code
    });
  }

  // Error genérico
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

/**
 * Clase personalizada de error HTTP
 */
class HttpError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'HttpError';
  }
}

module.exports = errorHandler;
module.exports.HttpError = HttpError;
