const express = require('express');
const { body } = require('express-validator');
const proposalController = require('../controllers/proposal.controller');
const { authenticate, requireModerator } = require('../middlewares/auth');

const router = express.Router();

/**
 * POST /api/proposals
 * Crear una propuesta
 */
router.post('/', authenticate, [
  body('action').isIn(['create', 'edit', 'delete']),
  body('data').isObject(),
  body('reason').optional().isLength({ max: 500 }),
  body('perfumeId').optional().isUUID()
], proposalController.createProposal);

/**
 * GET /api/proposals
 * Obtener propuestas pendientes (solo moderadores)
 */
router.get('/', authenticate, requireModerator, proposalController.getPendingProposals);

/**
 * GET /api/proposals/mine
 * Obtener mis propuestas
 */
router.get('/mine', authenticate, proposalController.getMyProposals);

/**
 * GET /api/proposals/:id
 * Obtener propuesta por ID
 */
router.get('/:id', authenticate, proposalController.getProposal);

/**
 * POST /api/proposals/:id/approve
 * Aprobar propuesta (solo moderadores)
 */
router.post('/:id/approve', authenticate, requireModerator, [
  body('reviewNotes').optional().isLength({ max: 500 })
], proposalController.approveProposal);

/**
 * POST /api/proposals/:id/reject
 * Rechazar propuesta (solo moderadores)
 */
router.post('/:id/reject', authenticate, requireModerator, [
  body('reviewNotes').optional().isLength({ max: 500 })
], proposalController.rejectProposal);

module.exports = router;
