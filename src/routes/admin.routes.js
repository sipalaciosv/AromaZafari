const express = require('express');
const { body } = require('express-validator');
const proposalController = require('../controllers/proposal.controller');
const { authenticate, requireModerator } = require('../middlewares/auth');

const router = express.Router();

/**
 * GET /api/admin/proposals
 * Propuestas pendientes
 */
router.get('/proposals', authenticate, requireModerator, proposalController.getPendingProposals);

/**
 * GET /api/admin/proposals/:id
 * Detalle de propuesta
 */
router.get('/proposals/:id', authenticate, requireModerator, proposalController.getProposal);

/**
 * POST /api/admin/proposals/:id/approve
 * Aprobar propuesta
 */
router.post('/proposals/:id/approve', authenticate, requireModerator, [
  body('reviewNotes').optional().isLength({ max: 500 })
], proposalController.approveProposal);

/**
 * POST /api/admin/proposals/:id/reject
 * Rechazar propuesta
 */
router.post('/proposals/:id/reject', authenticate, requireModerator, [
  body('reviewNotes').optional().isLength({ max: 500 })
], proposalController.rejectProposal);

module.exports = router;
