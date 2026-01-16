const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

/**
 * POST /api/auth/google
 * Login con Google
 */
router.post('/google', [
  body('idToken').notEmpty().withMessage('Token de Google requerido')
], authController.loginWithGoogle);

/**
 * POST /api/auth/logout
 * Cerrar sesión
 */
router.post('/logout', authenticate, authController.logout);

/**
 * GET /api/auth/me
 * Usuario actual
 */
router.get('/me', authenticate, authController.getCurrentUser);

module.exports = router;
