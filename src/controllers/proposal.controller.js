const Proposal = require('../models/Proposal');
const Perfume = require('../models/Perfume');
const { validationResult } = require('express-validator');

/**
 * Crear una propuesta para un nuevo perfume
 */
async function createProposal(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { perfumeId, action, data, reason } = req.body;

    const proposal = await Proposal.create({
      perfumeId,
      action,
      data,
      reason,
      proposedBy: req.user.id
    });

    res.status(201).json({
      success: true,
      data: proposal
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Obtener propuestas pendientes (solo moderadores)
 */
async function getPendingProposals(req, res, next) {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = parseInt(req.query.offset, 10) || 0;

    const proposals = await Proposal.getPending(limit, offset);
    const count = await Proposal.countPending();

    res.json({
      success: true,
      data: proposals,
      total: count
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Obtener mis propuestas
 */
async function getMyProposals(req, res, next) {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = parseInt(req.query.offset, 10) || 0;

    const proposals = await Proposal.findByUser(req.user.id, limit, offset);

    res.json({
      success: true,
      data: proposals
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Obtener propuesta por ID
 */
async function getProposal(req, res, next) {
  try {
    const proposal = await Proposal.findById(req.params.id);

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Propuesta no encontrada'
      });
    }

    // Solo el autor o moderadores pueden ver la propuesta
    if (proposal.proposed_by !== req.user.id && !req.user.is_moderator) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver esta propuesta'
      });
    }

    res.json({
      success: true,
      data: proposal
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Aprobar propuesta (solo moderadores)
 */
async function approveProposal(req, res, next) {
  try {
    const { reviewNotes } = req.body;
    const proposal = await Proposal.findById(req.params.id);

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Propuesta no encontrada'
      });
    }

    if (proposal.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Esta propuesta ya fue procesada'
      });
    }

    // Ejecutar la acción de la propuesta
    if (proposal.action === 'create') {
      const perfumeData = proposal.data;
      const perfume = await Perfume.create({
        ...perfumeData,
        createdBy: proposal.proposed_by,
        status: 'approved'
      });
      await Perfume.approve(perfume.id, req.user.id);
    } else if (proposal.action === 'edit' && proposal.perfume_id) {
      await Perfume.update(proposal.perfume_id, proposal.data);
    } else if (proposal.action === 'delete' && proposal.perfume_id) {
      await Perfume.delete(proposal.perfume_id);
    }

    // Marcar propuesta como aprobada
    const updatedProposal = await Proposal.approve(req.params.id, req.user.id, reviewNotes);

    res.json({
      success: true,
      data: updatedProposal
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Rechazar propuesta (solo moderadores)
 */
async function rejectProposal(req, res, next) {
  try {
    const { reviewNotes } = req.body;
    const proposal = await Proposal.findById(req.params.id);

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Propuesta no encontrada'
      });
    }

    if (proposal.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Esta propuesta ya fue procesada'
      });
    }

    const updatedProposal = await Proposal.reject(req.params.id, req.user.id, reviewNotes);

    res.json({
      success: true,
      data: updatedProposal
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createProposal,
  getPendingProposals,
  getMyProposals,
  getProposal,
  approveProposal,
  rejectProposal
};
