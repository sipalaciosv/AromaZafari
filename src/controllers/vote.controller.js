const Vote = require('../models/Vote');
const { validationResult } = require('express-validator');

/**
 * POST /api/votes/global - Votar globalmente
 */
async function upsertVote(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { perfumeId, calidad, proyeccion, duracion, parecido, comentario } = req.body;

    const vote = await Vote.upsert({
      perfumeId,
      userId: req.user.id,
      scope: 'global',
      groupId: null,
      calidad,
      proyeccion,
      duracion,
      parecido,
      comentario
    });

    res.json({
      success: true,
      data: vote
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/votes/group/:groupId - Votar en grupo
 */
async function upsertGroupVote(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { groupId } = req.params;
    const { perfumeId, calidad, proyeccion, duracion, parecido, comentario } = req.body;

    const vote = await Vote.upsert({
      perfumeId,
      userId: req.user.id,
      scope: 'group',
      groupId,
      calidad,
      proyeccion,
      duracion,
      parecido,
      comentario
    });

    res.json({
      success: true,
      data: vote
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/votes/mine - Mis votos
 */
async function getMyVotes(req, res, next) {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = parseInt(req.query.offset, 10) || 0;

    const votes = await Vote.findByUser(req.user.id, limit, offset);

    res.json({
      success: true,
      data: votes
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/votes/:id - Editar voto
 */
async function updateVote(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const { calidad, proyeccion, duracion, parecido, comentario } = req.body;

    const vote = await Vote.update(id, req.user.id, {
      calidad,
      proyeccion,
      duracion,
      parecido,
      comentario
    });

    if (!vote) {
      return res.status(404).json({
        success: false,
        message: 'Voto no encontrado o no tienes permiso para editarlo'
      });
    }

    res.json({
      success: true,
      data: vote
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/votes/:id - Eliminar voto
 */
async function deleteVote(req, res, next) {
  try {
    const { id } = req.params;
    
    const deleted = await Vote.deleteById(id, req.user.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Voto no encontrado o no tienes permiso para eliminarlo'
      });
    }

    res.json({
      success: true,
      message: 'Voto eliminado correctamente'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/groups/:id/votes - Votos del grupo
 */
async function getGroupVotes(req, res, next) {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = parseInt(req.query.offset, 10) || 0;

    const votes = await Vote.findByGroup(id, limit, offset);

    res.json({
      success: true,
      data: votes
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/groups/:id/perfumes/:perfumeId/votes - Votos de perfume en grupo
 */
async function getGroupPerfumeVotes(req, res, next) {
  try {
    const { id, perfumeId } = req.params;
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = parseInt(req.query.offset, 10) || 0;

    const votes = await Vote.findByPerfume(perfumeId, 'group', id, limit, offset);
    const stats = await Vote.getStats(perfumeId, 'group', id);

    res.json({
      success: true,
      data: {
        votes,
        stats
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  upsertVote,
  upsertGroupVote,
  getMyVotes,
  updateVote,
  deleteVote,
  getGroupVotes,
  getGroupPerfumeVotes
};
