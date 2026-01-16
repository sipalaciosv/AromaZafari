const express = require('express');
const { body } = require('express-validator');
const voteController = require('../controllers/vote.controller');
const { authenticate } = require('../middlewares/auth');
const { requireGroupMembership } = require('../middlewares/membership');

const router = express.Router();

/**
 * POST /api/votes/global
 * Votar globalmente
 */
router.post('/global', authenticate, [
  body('perfumeId').isUUID(),
  body('calidad').optional().isInt({ min: 1, max: 10 }),
  body('proyeccion').optional().isInt({ min: 1, max: 10 }),
  body('duracion').optional().isInt({ min: 1, max: 10 }),
  body('parecido').optional().isInt({ min: 1, max: 10 }),
  body('comentario').optional().isLength({ max: 1000 })
], voteController.upsertVote);

/**
 * POST /api/votes/group/:groupId
 * Votar en grupo
 */
router.post('/group/:groupId', authenticate, requireGroupMembership(), [
  body('perfumeId').isUUID(),
  body('calidad').optional().isInt({ min: 1, max: 10 }),
  body('proyeccion').optional().isInt({ min: 1, max: 10 }),
  body('duracion').optional().isInt({ min: 1, max: 10 }),
  body('parecido').optional().isInt({ min: 1, max: 10 }),
  body('comentario').optional().isLength({ max: 1000 })
], voteController.upsertGroupVote);

/**
 * GET /api/votes/mine
 * Mis votos
 */
router.get('/mine', authenticate, voteController.getMyVotes);

/**
 * PUT /api/votes/:id
 * Editar voto
 */
router.put('/:id', authenticate, [
  body('calidad').optional().isInt({ min: 1, max: 10 }),
  body('proyeccion').optional().isInt({ min: 1, max: 10 }),
  body('duracion').optional().isInt({ min: 1, max: 10 }),
  body('parecido').optional().isInt({ min: 1, max: 10 }),
  body('comentario').optional().isLength({ max: 1000 })
], voteController.updateVote);

/**
 * DELETE /api/votes/:id
 * Eliminar voto
 */
router.delete('/:id', authenticate, voteController.deleteVote);

module.exports = router;
