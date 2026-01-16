const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/user.controller');
const { authenticate, requireModerator } = require('../middlewares/auth');

const router = express.Router();

/**
 * GET /api/users/:id
 * Obtener perfil de usuario
 */
router.get('/:id', authenticate, userController.getUser);

/**
 * PUT /api/users/:id
 * Actualizar perfil del usuario (solo el propio usuario)
 */
router.put('/:id', authenticate, [
  body('displayName').optional().isLength({ min: 2, max: 100 }),
  body('photoUrl').optional().isURL()
], userController.updateProfile);

module.exports = router;
