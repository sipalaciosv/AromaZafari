const express = require('express');
const { body } = require('express-validator');
const perfumeController = require('../controllers/perfume.controller');
const { authenticate, optionalAuth, requireModerator } = require('../middlewares/auth');

const router = express.Router();

/**
 * GET /api/perfumes
 * Listar catálogo (aprobados)
 */
router.get('/', optionalAuth, perfumeController.searchPerfumes);

/**
 * GET /api/perfumes/search?q=
 * Buscar perfumes
 */
router.get('/search', optionalAuth, perfumeController.searchPerfumes);

/**
 * GET /api/perfumes/tags/popular
 * Tags más usados
 */
router.get('/tags/popular', perfumeController.getPopularTags);

/**
 * POST /api/perfumes/propose
 * Proponer nuevo perfume
 */
router.post('/propose', authenticate, [
  body('tipo').isIn(['original', 'dupe']),
  body('nombre').notEmpty().isLength({ min: 2, max: 200 }),
  body('marca').optional().isLength({ max: 100 }),
  body('ml').optional().isInt({ min: 1 }),
  body('parentId').optional().isUUID(),
  body('tags').optional().isArray(),
  body('reason').optional().isLength({ max: 500 })
], perfumeController.proposePerfume);

/**
 * GET /api/perfumes/:id
 * Detalle de perfume
 */
router.get('/:id', optionalAuth, perfumeController.getPerfume);

/**
 * GET /api/perfumes/:id/dupes
 * Listar dupes de un original
 */
router.get('/:id/dupes', perfumeController.getDupes);

/**
 * GET /api/perfumes/:id/votes
 * Votos globales de un perfume
 */
router.get('/:id/votes', perfumeController.getPerfumeVotes);

/**
 * PUT /api/perfumes/:id
 * Actualizar perfume (solo moderadores)
 */
router.put('/:id', authenticate, requireModerator, [
  body('nombre').optional().isLength({ min: 2, max: 200 }),
  body('marca').optional().isLength({ max: 100 }),
  body('ml').optional().isInt({ min: 1 })
], perfumeController.updatePerfume);

/**
 * DELETE /api/perfumes/:id
 * Eliminar perfume (solo moderadores)
 */
router.delete('/:id', authenticate, requireModerator, perfumeController.deletePerfume);

module.exports = router;

module.exports = router;
