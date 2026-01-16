const express = require('express');
const { body } = require('express-validator');
const storeController = require('../controllers/store.controller');
const { authenticate } = require('../middlewares/auth');
const { requireGroupMembership } = require('../middlewares/membership');

const router = express.Router();

/**
 * POST /api/stores/groups/:groupId
 * Crear una nueva tienda en un grupo
 */
router.post('/groups/:groupId', authenticate, requireGroupMembership(['owner', 'editor']), [
  body('nombre').notEmpty().isLength({ min: 2, max: 100 }),
  body('tipo').isIn(['fisica', 'online']),
  body('direccion').optional().isLength({ max: 255 }),
  body('url').optional().isURL()
], storeController.createStore);

/**
 * GET /api/stores/groups/:groupId
 * Obtener tiendas de un grupo
 */
router.get('/groups/:groupId', authenticate, requireGroupMembership(), storeController.getGroupStores);

/**
 * GET /api/stores/:id
 * Obtener tienda por ID
 */
router.get('/:id', authenticate, storeController.getStore);

/**
 * PUT /api/stores/:id
 * Actualizar tienda
 */
router.put('/:id', authenticate, [
  body('nombre').optional().isLength({ min: 2, max: 100 }),
  body('tipo').optional().isIn(['fisica', 'online']),
  body('direccion').optional().isLength({ max: 255 }),
  body('url').optional().isURL()
], storeController.updateStore);

/**
 * DELETE /api/stores/:id
 * Eliminar tienda
 */
router.delete('/:id', authenticate, storeController.deleteStore);

module.exports = router;
