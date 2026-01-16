const Group = require('../models/Group');
const { validationResult } = require('express-validator');

/**
 * Crear un nuevo grupo
 */
async function createGroup(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, description, publicRead, publicSlug } = req.body;
    const group = await Group.create({
      name,
      description,
      ownerId: req.user.id,
      publicRead,
      publicSlug
    });

    res.status(201).json({
      success: true,
      data: group
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Obtener mis grupos
 */
async function getMyGroups(req, res, next) {
  try {
    const groups = await Group.findByUserId(req.user.id);

    res.json({
      success: true,
      data: groups
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Obtener grupo por ID
 */
async function getGroup(req, res, next) {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Grupo no encontrado'
      });
    }

    res.json({
      success: true,
      data: group
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Obtener grupo público por slug
 */
async function getPublicGroup(req, res, next) {
  try {
    const group = await Group.findBySlug(req.params.slug);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Grupo no encontrado'
      });
    }

    res.json({
      success: true,
      data: group
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Actualizar grupo
 */
async function updateGroup(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, description, publicRead, publicSlug } = req.body;
    const group = await Group.update(req.params.id, {
      name,
      description,
      publicRead,
      publicSlug
    });

    res.json({
      success: true,
      data: group
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Eliminar grupo
 */
async function deleteGroup(req, res, next) {
  try {
    await Group.delete(req.params.id);

    res.json({
      success: true,
      message: 'Grupo eliminado correctamente'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Regenerar código de invitación
 */
async function regenerateInviteCode(req, res, next) {
  try {
    const newCode = await Group.regenerateInviteCode(req.params.id);

    res.json({
      success: true,
      data: { inviteCode: newCode }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Unirse a un grupo con código de invitación (POST /api/groups/join/:code)
 */
async function joinGroup(req, res, next) {
  try {
    const { code } = req.params;
    const group = await Group.findByInviteCode(code);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Código de invitación inválido'
      });
    }

    try {
      await Group.addMember(group.id, req.user.id, 'member');
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          success: false,
          message: 'Ya eres miembro de este grupo'
        });
      }
      throw error;
    }

    const updatedGroup = await Group.findById(group.id);

    res.json({
      success: true,
      data: updatedGroup
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Obtener miembros del grupo
 */
async function getMembers(req, res, next) {
  try {
    const members = await Group.getMembers(req.params.id);

    res.json({
      success: true,
      data: members
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Actualizar rol de un miembro
 */
async function updateMemberRole(req, res, next) {
  try {
    const { role } = req.body;
    await Group.updateMemberRole(req.params.id, req.params.userId, role);

    res.json({
      success: true,
      message: 'Rol actualizado correctamente'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/groups/:id/members - Invitar miembro
 */
async function addMember(req, res, next) {
  try {
    const { userId, role } = req.body;
    
    try {
      await Group.addMember(req.params.id, userId, role || 'member');
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          success: false,
          message: 'El usuario ya es miembro de este grupo'
        });
      }
      throw error;
    }

    res.status(201).json({
      success: true,
      message: 'Miembro añadido correctamente'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Eliminar miembro del grupo
 */
async function removeMember(req, res, next) {
  try {
    await Group.removeMember(req.params.id, req.params.userId);

    res.json({
      success: true,
      message: 'Miembro eliminado correctamente'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Salir del grupo
 */
async function leaveGroup(req, res, next) {
  try {
    const group = await Group.findById(req.params.id);

    if (group.owner_id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'El propietario no puede abandonar el grupo. Transfiere la propiedad o elimina el grupo.'
      });
    }

    await Group.removeMember(req.params.id, req.user.id);

    res.json({
      success: true,
      message: 'Has abandonado el grupo'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createGroup,
  getMyGroups,
  getGroup,
  getPublicGroup,
  updateGroup,
  deleteGroup,
  regenerateInviteCode,
  joinGroup,
  getMembers,
  addMember,
  updateMemberRole,
  removeMember,
  leaveGroup
};
