const express = require('express');
const { body } = require('express-validator');
const groupController = require('../controllers/group.controller');
const storeController = require('../controllers/store.controller');
const priceController = require('../controllers/price.controller');
const voteController = require('../controllers/vote.controller');
const { authenticate } = require('../middlewares/auth');
const { requireGroupMembership } = require('../middlewares/membership');

const router = express.Router();

// ==================== GRUPOS ====================

/**
 * GET /api/groups
 * Mis grupos
 */
router.get('/', authenticate, groupController.getMyGroups);

/**
 * POST /api/groups
 * Crear grupo
 */
router.post('/', authenticate, [
  body('name').notEmpty().isLength({ min: 2, max: 100 }),
  body('description').optional().isLength({ max: 500 }),
  body('publicRead').optional().isBoolean(),
  body('publicSlug').optional().isLength({ min: 3, max: 50 })
], groupController.createGroup);

/**
 * GET /api/groups/public/:slug
 * Vista pública
 */
router.get('/public/:slug', groupController.getPublicGroup);

/**
 * POST /api/groups/join/:code
 * Unirse con código
 */
router.post('/join/:code', authenticate, groupController.joinGroup);

/**
 * GET /api/groups/:id
 * Detalle grupo
 */
router.get('/:id', authenticate, requireGroupMembership(), groupController.getGroup);

/**
 * PUT /api/groups/:id
 * Editar grupo
 */
router.put('/:id', authenticate, requireGroupMembership(['owner', 'editor']), [
  body('name').optional().isLength({ min: 2, max: 100 }),
  body('description').optional().isLength({ max: 500 }),
  body('publicRead').optional().isBoolean(),
  body('publicSlug').optional().isLength({ min: 3, max: 50 })
], groupController.updateGroup);

/**
 * DELETE /api/groups/:id
 * Eliminar grupo
 */
router.delete('/:id', authenticate, requireGroupMembership(['owner']), groupController.deleteGroup);

// ==================== MIEMBROS ====================

/**
 * GET /api/groups/:id/members
 * Listar miembros
 */
router.get('/:id/members', authenticate, requireGroupMembership(), groupController.getMembers);

/**
 * POST /api/groups/:id/members
 * Invitar miembro
 */
router.post('/:id/members', authenticate, requireGroupMembership(['owner', 'editor']), [
  body('userId').isUUID(),
  body('role').optional().isIn(['editor', 'member', 'viewer'])
], groupController.addMember);

/**
 * PUT /api/groups/:id/members/:userId
 * Cambiar rol
 */
router.put('/:id/members/:userId', authenticate, requireGroupMembership(['owner']), [
  body('role').isIn(['editor', 'member', 'viewer'])
], groupController.updateMemberRole);

/**
 * DELETE /api/groups/:id/members/:userId
 * Expulsar
 */
router.delete('/:id/members/:userId', authenticate, requireGroupMembership(['owner', 'editor']), groupController.removeMember);

// ==================== TIENDAS ====================

/**
 * GET /api/groups/:id/stores
 * Listar tiendas
 */
router.get('/:id/stores', authenticate, requireGroupMembership(), storeController.getGroupStores);

/**
 * POST /api/groups/:id/stores
 * Crear tienda
 */
router.post('/:id/stores', authenticate, requireGroupMembership(['owner', 'editor']), [
  body('nombre').notEmpty().isLength({ min: 2, max: 100 }),
  body('tipo').isIn(['fisica', 'online']),
  body('direccion').optional().isLength({ max: 255 }),
  body('url').optional().isURL()
], storeController.createStore);

/**
 * PUT /api/groups/:id/stores/:storeId
 * Editar tienda
 */
router.put('/:id/stores/:storeId', authenticate, requireGroupMembership(['owner', 'editor']), [
  body('nombre').optional().isLength({ min: 2, max: 100 }),
  body('tipo').optional().isIn(['fisica', 'online']),
  body('direccion').optional().isLength({ max: 255 }),
  body('url').optional().isURL()
], storeController.updateStore);

/**
 * DELETE /api/groups/:id/stores/:storeId
 * Eliminar tienda
 */
router.delete('/:id/stores/:storeId', authenticate, requireGroupMembership(['owner', 'editor']), storeController.deleteStore);

// ==================== PRECIOS ====================

/**
 * GET /api/groups/:id/prices
 * Precios actuales
 */
router.get('/:id/prices', authenticate, requireGroupMembership(), priceController.getGroupPrices);

/**
 * POST /api/groups/:id/prices
 * Agregar/actualizar precio
 */
router.post('/:id/prices', authenticate, requireGroupMembership(['owner', 'editor', 'member']), [
  body('perfumeId').isUUID(),
  body('storeId').isUUID(),
  body('precio').isDecimal({ decimal_digits: '0,2' }),
  body('agotado').optional().isBoolean(),
  body('nota').optional().isLength({ max: 255 })
], priceController.upsertPrice);

/**
 * GET /api/groups/:id/perfumes/:perfumeId/prices
 * Precios de un perfume
 */
router.get('/:id/perfumes/:perfumeId/prices', authenticate, requireGroupMembership(), priceController.getPerfumePrices);

/**
 * GET /api/groups/:id/perfumes/:perfumeId/price-history
 * Historial de precios
 */
router.get('/:id/perfumes/:perfumeId/price-history', authenticate, requireGroupMembership(), priceController.getPriceHistory);

// ==================== VOTOS DEL GRUPO ====================

/**
 * GET /api/groups/:id/votes
 * Votos del grupo
 */
router.get('/:id/votes', authenticate, requireGroupMembership(), voteController.getGroupVotes);

/**
 * GET /api/groups/:id/perfumes/:perfumeId/votes
 * Votos de perfume en grupo
 */
router.get('/:id/perfumes/:perfumeId/votes', authenticate, requireGroupMembership(), voteController.getGroupPerfumeVotes);

module.exports = router;
