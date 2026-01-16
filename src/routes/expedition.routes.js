const express = require('express');
const { body } = require('express-validator');
const expeditionController = require('../controllers/expedition.controller');
const { authenticate } = require('../middlewares/auth');
const { requireExpeditionMembership, requireGroupMembership } = require('../middlewares/membership');

const router = express.Router();

/**
 * POST /api/expeditions
 * Crear una nueva expedición
 */
router.post('/', authenticate, [
  body('nombre').notEmpty().isLength({ min: 2, max: 100 }),
  body('fecha').isISO8601(),
  body('visibility').optional().isIn(['personal', 'group']),
  body('groupId').optional().isUUID()
], expeditionController.createExpedition);

/**
 * GET /api/expeditions
 * Obtener mis expediciones
 */
router.get('/', authenticate, expeditionController.getMyExpeditions);

/**
 * GET /api/expeditions/groups/:groupId
 * Obtener expediciones de un grupo
 */
router.get('/groups/:groupId', authenticate, requireGroupMembership(), expeditionController.getGroupExpeditions);

/**
 * GET /api/expeditions/:id
 * Obtener expedición por ID
 */
router.get('/:id', authenticate, requireExpeditionMembership(), expeditionController.getExpedition);

/**
 * PUT /api/expeditions/:id
 * Actualizar expedición
 */
router.put('/:id', authenticate, requireExpeditionMembership(['owner', 'editor']), [
  body('nombre').optional().isLength({ min: 2, max: 100 }),
  body('fecha').optional().isISO8601(),
  body('estado').optional().isIn(['planificando', 'activa', 'cerrada'])
], expeditionController.updateExpedition);

/**
 * DELETE /api/expeditions/:id
 * Eliminar expedición
 */
router.delete('/:id', authenticate, requireExpeditionMembership(['owner']), expeditionController.deleteExpedition);

// ==================== MIEMBROS ====================

/**
 * GET /api/expeditions/:id/members
 * Obtener miembros de la expedición
 */
router.get('/:id/members', authenticate, requireExpeditionMembership(), expeditionController.getMembers);

/**
 * POST /api/expeditions/:id/members
 * Añadir miembro a la expedición
 */
router.post('/:id/members', authenticate, requireExpeditionMembership(['owner', 'editor']), [
  body('userId').isUUID(),
  body('role').optional().isIn(['editor', 'viewer'])
], expeditionController.addMember);

/**
 * DELETE /api/expeditions/:id/members/:userId
 * Eliminar miembro de la expedición
 */
router.delete('/:id/members/:userId', authenticate, requireExpeditionMembership(['owner']), expeditionController.removeMember);

// ==================== ITEMS ====================

/**
 * GET /api/expeditions/:id/items
 * Obtener items de la expedición
 */
router.get('/:id/items', authenticate, requireExpeditionMembership(), expeditionController.getItems);

/**
 * POST /api/expeditions/:id/items
 * Añadir item a la expedición
 */
router.post('/:id/items', authenticate, requireExpeditionMembership(['owner', 'editor']), [
  body('perfumeId').optional().isUUID(),
  body('nombreManual').optional().isLength({ max: 200 })
], expeditionController.addItem);

/**
 * PUT /api/expeditions/:id/items/:itemId/status
 * Actualizar estado del item
 */
router.put('/:id/items/:itemId/status', authenticate, requireExpeditionMembership(['owner', 'editor']), [
  body('status').isIn(['pendiente', 'probado', 'no_encontrado', 'comprado', 'descartado'])
], expeditionController.updateItemStatus);

/**
 * DELETE /api/expeditions/:id/items/:itemId
 * Eliminar item
 */
router.delete('/:id/items/:itemId', authenticate, requireExpeditionMembership(['owner', 'editor']), expeditionController.removeItem);

// ==================== NOTAS ====================

/**
 * GET /api/expeditions/:id/items/:itemId/notes
 * Obtener notas de un item
 */
router.get('/:id/items/:itemId/notes', authenticate, requireExpeditionMembership(), expeditionController.getItemNotes);

/**
 * POST /api/expeditions/:id/items/:itemId/notes
 * Añadir nota a un item
 */
router.post('/:id/items/:itemId/notes', authenticate, requireExpeditionMembership(), [
  body('nota').notEmpty().isLength({ max: 1000 }),
  body('rating').optional().isInt({ min: 1, max: 5 })
], expeditionController.addItemNote);

/**
 * DELETE /api/expeditions/:id/items/:itemId/notes/:noteId
 * Eliminar nota
 */
router.delete('/:id/items/:itemId/notes/:noteId', authenticate, requireExpeditionMembership(['owner', 'editor']), expeditionController.removeItemNote);

module.exports = router;
