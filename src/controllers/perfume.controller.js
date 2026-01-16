const Perfume = require('../models/Perfume');
const Vote = require('../models/Vote');
const { validationResult } = require('express-validator');

/**
 * Crear un nuevo perfume
 */
async function createPerfume(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { tipo, parentId, nombre, marca, ml, imagenPrincipal, urlFragrantica, tags } = req.body;

    // Si es moderador, se aprueba automáticamente
    const status = req.user.is_moderator ? 'approved' : 'pending';

    const perfume = await Perfume.create({
      tipo,
      parentId,
      nombre,
      marca,
      ml,
      imagenPrincipal,
      urlFragrantica,
      createdBy: req.user.id,
      status
    });

    // Añadir tags si se proporcionan
    if (tags && Array.isArray(tags)) {
      for (const tag of tags) {
        await Perfume.addTag(perfume.id, tag);
      }
    }

    const result = await Perfume.findById(perfume.id);

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Buscar perfumes
 */
async function searchPerfumes(req, res, next) {
  try {
    const { tipo, marca, q, parentId, status } = req.query;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = parseInt(req.query.offset, 10) || 0;

    // Solo moderadores pueden ver pendientes/rechazados
    let searchStatus = 'approved';
    if (status && req.user?.is_moderator) {
      searchStatus = status;
    }

    const result = await Perfume.search({
      tipo,
      marca,
      search: q,
      parentId,
      status: searchStatus,
      limit,
      offset
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Obtener perfume por ID
 */
async function getPerfume(req, res, next) {
  try {
    const perfume = await Perfume.findById(req.params.id);

    if (!perfume) {
      return res.status(404).json({
        success: false,
        message: 'Perfume no encontrado'
      });
    }

    // Solo moderadores o el creador pueden ver perfumes no aprobados
    if (perfume.status !== 'approved') {
      if (!req.user || (!req.user.is_moderator && perfume.created_by !== req.user.id)) {
        return res.status(404).json({
          success: false,
          message: 'Perfume no encontrado'
        });
      }
    }

    res.json({
      success: true,
      data: perfume
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Obtener perfume por slug
 */
async function getPerfumeBySlug(req, res, next) {
  try {
    const perfume = await Perfume.findBySlug(req.params.slug);

    if (!perfume || perfume.status !== 'approved') {
      return res.status(404).json({
        success: false,
        message: 'Perfume no encontrado'
      });
    }

    res.json({
      success: true,
      data: perfume
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Obtener dupes de un perfume original
 */
async function getDupes(req, res, next) {
  try {
    const dupes = await Perfume.getDupes(req.params.id);

    res.json({
      success: true,
      data: dupes
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Obtener marcas disponibles
 */
async function getBrands(req, res, next) {
  try {
    const brands = await Perfume.getBrands();

    res.json({
      success: true,
      data: brands
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Actualizar perfume (solo moderadores)
 */
async function updatePerfume(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { nombre, marca, ml, imagenPrincipal, urlFragrantica } = req.body;
    const perfume = await Perfume.update(req.params.id, {
      nombre,
      marca,
      ml,
      imagenPrincipal,
      urlFragrantica
    });

    res.json({
      success: true,
      data: perfume
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Aprobar perfume (solo moderadores)
 */
async function approvePerfume(req, res, next) {
  try {
    const perfume = await Perfume.approve(req.params.id, req.user.id);

    res.json({
      success: true,
      data: perfume
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Rechazar perfume (solo moderadores)
 */
async function rejectPerfume(req, res, next) {
  try {
    const perfume = await Perfume.reject(req.params.id);

    res.json({
      success: true,
      data: perfume
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Añadir tag a un perfume
 */
async function addTag(req, res, next) {
  try {
    const { tag } = req.body;
    await Perfume.addTag(req.params.id, tag);

    res.json({
      success: true,
      message: 'Tag añadido correctamente'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Eliminar tag de un perfume
 */
async function removeTag(req, res, next) {
  try {
    await Perfume.removeTag(req.params.id, req.params.tag);

    res.json({
      success: true,
      message: 'Tag eliminado correctamente'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Añadir URL a un perfume
 */
async function addUrl(req, res, next) {
  try {
    const { tipo, url } = req.body;
    await Perfume.addUrl(req.params.id, tipo, url);

    res.json({
      success: true,
      message: 'URL añadida correctamente'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Eliminar URL de un perfume
 */
async function removeUrl(req, res, next) {
  try {
    await Perfume.removeUrl(req.params.urlId);

    res.json({
      success: true,
      message: 'URL eliminada correctamente'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Eliminar perfume (solo moderadores)
 */
async function deletePerfume(req, res, next) {
  try {
    await Perfume.delete(req.params.id);

    res.json({
      success: true,
      message: 'Perfume eliminado correctamente'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Proponer un nuevo perfume (crea con estado pending)
 */
async function proposePerfume(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { tipo, parentId, nombre, marca, ml, imagenPrincipal, urlFragrantica, tags } = req.body;

    const perfume = await Perfume.create({
      tipo,
      parentId,
      nombre,
      marca,
      ml,
      imagenPrincipal,
      urlFragrantica,
      createdBy: req.user.id,
      status: 'pending'
    });

    // Añadir tags si se proporcionan
    if (tags && Array.isArray(tags)) {
      for (const tag of tags) {
        await Perfume.addTag(perfume.id, tag);
      }
    }

    const result = await Perfume.findById(perfume.id);

    res.status(201).json({
      success: true,
      message: 'Propuesta enviada correctamente. Será revisada por un moderador.',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Obtener tags populares
 */
async function getPopularTags(req, res, next) {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const tags = await Perfume.getPopularTags(limit);

    res.json({
      success: true,
      data: tags
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Obtener votos de un perfume
 */
async function getPerfumeVotes(req, res, next) {
  try {
    const votes = await Vote.findByPerfume(req.params.id);
    const stats = await Vote.getStats(req.params.id);

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
  createPerfume,
  searchPerfumes,
  getPerfume,
  getPerfumeBySlug,
  getDupes,
  getBrands,
  updatePerfume,
  approvePerfume,
  rejectPerfume,
  addTag,
  removeTag,
  addUrl,
  removeUrl,
  deletePerfume,
  proposePerfume,
  getPopularTags,
  getPerfumeVotes
};
