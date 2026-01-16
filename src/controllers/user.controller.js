const User = require('../models/User');
const Vote = require('../models/Vote');
const { validationResult } = require('express-validator');

/**
 * Obtener perfil de usuario por ID
 */
async function getUser(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    
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
 * Actualizar perfil del usuario (solo el propio usuario puede editarse)
 */
async function updateProfile(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Verificar que el usuario solo pueda editar su propio perfil
    if (req.params.id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para editar este perfil'
      });
    }

    const { displayName, photoUrl } = req.body;
    const user = await User.update(req.params.id, { displayName, photoUrl });

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Obtener votos del usuario actual
 */
async function getMyVotes(req, res, next) {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = parseInt(req.query.offset, 10) || 0;

    const votes = await Vote.findByUser(req.user.id, limit, offset);

    res.json({
      success: true,
      data: votes
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Obtener lista de moderadores (solo para moderadores)
 */
async function getModerators(req, res, next) {
  try {
    const moderators = await User.getModerators();

    res.json({
      success: true,
      data: moderators
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Establecer/quitar rol de moderador (solo para moderadores)
 */
async function setModerator(req, res, next) {
  try {
    const { isModerator } = req.body;
    const user = await User.setModerator(req.params.id, isModerator);

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

module.exports = {
  getUser,
  updateProfile,
  getMyVotes,
  getModerators,
  setModerator
};
