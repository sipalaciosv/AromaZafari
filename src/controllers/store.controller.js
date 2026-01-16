const Store = require('../models/Store');
const { validationResult } = require('express-validator');

/**
 * Crear una nueva tienda
 */
async function createStore(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const groupId = req.params.id || req.params.groupId;
    const { nombre, tipo, direccion, url } = req.body;

    const store = await Store.create({
      groupId,
      nombre,
      tipo,
      direccion,
      url,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      data: store
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Obtener tiendas de un grupo
 */
async function getGroupStores(req, res, next) {
  try {
    const groupId = req.params.id || req.params.groupId;
    const stores = await Store.findByGroupId(groupId);

    res.json({
      success: true,
      data: stores
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Obtener tienda por ID
 */
async function getStore(req, res, next) {
  try {
    const store = await Store.findById(req.params.id);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Tienda no encontrada'
      });
    }

    res.json({
      success: true,
      data: store
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Actualizar tienda
 */
async function updateStore(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { nombre, tipo, direccion, url } = req.body;
    const store = await Store.update(req.params.id, { nombre, tipo, direccion, url });

    res.json({
      success: true,
      data: store
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Eliminar tienda
 */
async function deleteStore(req, res, next) {
  try {
    await Store.delete(req.params.id);

    res.json({
      success: true,
      message: 'Tienda eliminada correctamente'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createStore,
  getGroupStores,
  getStore,
  updateStore,
  deleteStore
};
