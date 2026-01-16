const express = require('express');
const { body } = require('express-validator');
const priceController = require('../controllers/price.controller');
const { authenticate } = require('../middlewares/auth');
const { requireGroupMembership } = require('../middlewares/membership');

const router = express.Router();

/**
 * POST /api/prices/groups/:groupId
 * Crear o actualizar precio
 */
router.post('/groups/:groupId', authenticate, requireGroupMembership(['owner', 'editor', 'member']), [
  body('perfumeId').isUUID(),
  body('storeId').isUUID(),
  body('precio').isDecimal({ decimal_digits: '0,2' }),
  body('agotado').optional().isBoolean(),
  body('nota').optional().isLength({ max: 255 })
], priceController.upsertPrice);

/**
 * GET /api/prices/groups/:groupId
 * Obtener todos los precios de un grupo
 */
router.get('/groups/:groupId', authenticate, requireGroupMembership(), priceController.getGroupPrices);

/**
 * GET /api/prices/groups/:groupId/perfumes/:perfumeId
 * Obtener precios de un perfume en un grupo
 */
router.get('/groups/:groupId/perfumes/:perfumeId', authenticate, requireGroupMembership(), priceController.getPerfumePrices);

/**
 * GET /api/prices/stores/:storeId
 * Obtener precios de una tienda
 */
router.get('/stores/:storeId', authenticate, priceController.getStorePrices);

/**
 * GET /api/prices/history/:perfumeId/:storeId
 * Obtener historial de precios
 */
router.get('/history/:perfumeId/:storeId', authenticate, priceController.getPriceHistory);

/**
 * GET /api/prices/lowest/:perfumeId
 * Obtener precio más bajo de un perfume
 */
router.get('/lowest/:perfumeId', authenticate, priceController.getLowestPrice);

/**
 * DELETE /api/prices/groups/:groupId/perfumes/:perfumeId/stores/:storeId
 * Eliminar precio
 */
router.delete('/groups/:groupId/perfumes/:perfumeId/stores/:storeId', 
  authenticate, 
  requireGroupMembership(['owner', 'editor']), 
  priceController.deletePrice
);

module.exports = router;
