const Price = require('../models/Price');
const { validationResult } = require('express-validator');

/**
 * Crear o actualizar precio
 */
async function upsertPrice(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const groupId = req.params.id || req.params.groupId;
    const { perfumeId, storeId, precio, agotado, nota } = req.body;

    const price = await Price.upsert({
      groupId,
      perfumeId,
      storeId,
      precio,
      agotado,
      nota,
      updatedBy: req.user.id
    });

    res.json({
      success: true,
      data: price
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Obtener precios de un perfume en un grupo
 */
async function getPerfumePrices(req, res, next) {
  try {
    const groupId = req.params.id || req.params.groupId;
    const { perfumeId } = req.params;
    const prices = await Price.findByPerfume(groupId, perfumeId);

    res.json({
      success: true,
      data: prices
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Obtener precios de una tienda
 */
async function getStorePrices(req, res, next) {
  try {
    const prices = await Price.findByStore(req.params.storeId);

    res.json({
      success: true,
      data: prices
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Obtener todos los precios de un grupo
 */
async function getGroupPrices(req, res, next) {
  try {
    const groupId = req.params.id || req.params.groupId;
    const { agotado, storeId } = req.query;
    const filters = {};

    if (agotado !== undefined) {
      filters.agotado = agotado === 'true';
    }
    if (storeId) {
      filters.storeId = storeId;
    }

    const prices = await Price.findByGroup(groupId, filters);

    res.json({
      success: true,
      data: prices
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Obtener historial de precios
 */
async function getPriceHistory(req, res, next) {
  try {
    const { perfumeId, storeId } = req.params;
    const limit = parseInt(req.query.limit, 10) || 30;

    const history = await Price.getHistory(perfumeId, storeId, limit);

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Obtener precio más bajo de un perfume
 */
async function getLowestPrice(req, res, next) {
  try {
    const { perfumeId } = req.params;
    const { groupId } = req.query;

    const price = await Price.getLowestPrice(perfumeId, groupId);

    res.json({
      success: true,
      data: price
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Eliminar precio
 */
async function deletePrice(req, res, next) {
  try {
    const groupId = req.params.id || req.params.groupId;
    const { perfumeId, storeId } = req.params;
    await Price.delete(groupId, perfumeId, storeId);

    res.json({
      success: true,
      message: 'Precio eliminado correctamente'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  upsertPrice,
  getPerfumePrices,
  getStorePrices,
  getGroupPrices,
  getPriceHistory,
  getLowestPrice,
  deletePrice
};
