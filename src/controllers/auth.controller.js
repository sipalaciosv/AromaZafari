const User = require('../models/User');
const { generateToken } = require('../config/jwt');
const { validationResult } = require('express-validator');

/**
 * Login con Google
 * Recibe el idToken de Google y valida/crea usuario
 */
async function loginWithGoogle(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { idToken } = req.body;

    // TODO: Validar el idToken con Google OAuth2
    // En producción, decodificar el token y extraer información del usuario
    // Por ahora, simulamos que el token contiene la información
    // const ticket = await googleClient.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
    // const payload = ticket.getPayload();
    
    // Simulación: En producción, estos datos vienen del token de Google
    const { email, name, picture, sub } = req.body; // Datos que vendrían del token decodificado

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'No se pudo obtener información del usuario de Google'
      });
    }

    // Buscar usuario existente
    let user = await User.findByEmail(email);

    if (!user) {
      // Crear nuevo usuario
      user = await User.create({
        id: sub,
        email,
        displayName: name,
        photoUrl: picture,
        authProvider: 'google'
      });
    }

    // Generar token JWT
    const token = generateToken({
      id: user.id,
      email: user.email,
      isModerator: user.is_moderator
    });

    res.json({
      success: true,
      data: {
        user,
        token
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Cerrar sesión
 * En JWT stateless, el logout se maneja en el cliente eliminando el token
 * Este endpoint puede usarse para invalidar tokens en una blacklist (opcional)
 */
async function logout(req, res, next) {
  try {
    // En una implementación con blacklist de tokens:
    // await TokenBlacklist.add(req.token, req.user.id);
    
    res.json({
      success: true,
      message: 'Sesión cerrada correctamente'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Obtener usuario actual
 */
async function getCurrentUser(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Refrescar token
 */
async function refreshToken(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      isModerator: user.is_moderator
    });

    res.json({
      success: true,
      data: { token }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  loginWithGoogle,
  logout,
  getCurrentUser
};
