const Expedition = require('../models/Expedition');
const { validationResult } = require('express-validator');

/**
 * Crear una nueva expedición
 */
async function createExpedition(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { nombre, fecha, visibility, groupId } = req.body;

    const expedition = await Expedition.create({
      nombre,
      fecha,
      visibility: visibility || 'personal',
      groupId: visibility === 'group' ? groupId : null,
      ownerId: req.user.id
    });

    res.status(201).json({
      success: true,
      data: expedition
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Obtener mis expediciones
 */
async function getMyExpeditions(req, res, next) {
  try {
    const { estado, visibility } = req.query;
    const expeditions = await Expedition.findByUserId(req.user.id, { estado, visibility });

    res.json({
      success: true,
      data: expeditions
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Obtener expediciones de un grupo
 */
async function getGroupExpeditions(req, res, next) {
  try {
    const expeditions = await Expedition.findByGroupId(req.params.groupId);

    res.json({
      success: true,
      data: expeditions
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Obtener expedición por ID
 */
async function getExpedition(req, res, next) {
  try {
    const expedition = await Expedition.findById(req.params.id);

    if (!expedition) {
      return res.status(404).json({
        success: false,
        message: 'Expedición no encontrada'
      });
    }

    res.json({
      success: true,
      data: expedition
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Actualizar expedición
 */
async function updateExpedition(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { nombre, fecha, estado } = req.body;
    const expedition = await Expedition.update(req.params.id, { nombre, fecha, estado });

    res.json({
      success: true,
      data: expedition
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Eliminar expedición
 */
async function deleteExpedition(req, res, next) {
  try {
    await Expedition.delete(req.params.id);

    res.json({
      success: true,
      message: 'Expedición eliminada correctamente'
    });
  } catch (error) {
    next(error);
  }
}

// ==================== MIEMBROS ====================

/**
 * Obtener miembros de la expedición
 */
async function getMembers(req, res, next) {
  try {
    const members = await Expedition.getMembers(req.params.id);

    res.json({
      success: true,
      data: members
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Añadir miembro a la expedición
 */
async function addMember(req, res, next) {
  try {
    const { userId, role } = req.body;
    const member = await Expedition.addMember(req.params.id, userId, role || 'viewer');

    res.status(201).json({
      success: true,
      data: member
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Eliminar miembro de la expedición
 */
async function removeMember(req, res, next) {
  try {
    await Expedition.removeMember(req.params.id, req.params.userId);

    res.json({
      success: true,
      message: 'Miembro eliminado correctamente'
    });
  } catch (error) {
    next(error);
  }
}

// ==================== ITEMS ====================

/**
 * Obtener items de la expedición
 */
async function getItems(req, res, next) {
  try {
    const items = await Expedition.getItems(req.params.id);

    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Añadir item a la expedición
 */
async function addItem(req, res, next) {
  try {
    const { perfumeId, nombreManual } = req.body;

    if (!perfumeId && !nombreManual) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar perfumeId o nombreManual'
      });
    }

    const item = await Expedition.addItem(req.params.id, {
      perfumeId,
      nombreManual,
      addedBy: req.user.id
    });

    res.status(201).json({
      success: true,
      data: item
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Actualizar estado del item
 */
async function updateItemStatus(req, res, next) {
  try {
    const { status } = req.body;
    const item = await Expedition.updateItemStatus(req.params.itemId, status);

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Eliminar item
 */
async function removeItem(req, res, next) {
  try {
    await Expedition.removeItem(req.params.itemId);

    res.json({
      success: true,
      message: 'Item eliminado correctamente'
    });
  } catch (error) {
    next(error);
  }
}

// ==================== NOTAS ====================

/**
 * Obtener notas de un item
 */
async function getItemNotes(req, res, next) {
  try {
    const notes = await Expedition.getItemNotes(req.params.itemId);

    res.json({
      success: true,
      data: notes
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Añadir nota a un item
 */
async function addItemNote(req, res, next) {
  try {
    const { nota, rating } = req.body;

    if (!nota) {
      return res.status(400).json({
        success: false,
        message: 'La nota es requerida'
      });
    }

    const note = await Expedition.addItemNote(req.params.itemId, req.user.id, nota, rating);

    res.status(201).json({
      success: true,
      data: note
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Eliminar nota
 */
async function removeItemNote(req, res, next) {
  try {
    await Expedition.removeItemNote(req.params.noteId);

    res.json({
      success: true,
      message: 'Nota eliminada correctamente'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createExpedition,
  getMyExpeditions,
  getGroupExpeditions,
  getExpedition,
  updateExpedition,
  deleteExpedition,
  getMembers,
  addMember,
  removeMember,
  getItems,
  addItem,
  updateItemStatus,
  removeItem,
  getItemNotes,
  addItemNote,
  removeItemNote
};
