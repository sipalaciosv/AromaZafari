const pool = require('../config/database');

/**
 * Middleware para verificar membresía en un grupo
 * @param {string[]} allowedRoles - Roles permitidos (owner, editor, member, viewer)
 */
function requireGroupMembership(allowedRoles = ['owner', 'editor', 'member', 'viewer']) {
  return async (req, res, next) => {
    try {
      const groupId = req.params.groupId || req.body.group_id;
      
      if (!groupId) {
        return res.status(400).json({
          success: false,
          message: 'ID de grupo requerido'
        });
      }

      const [members] = await pool.query(
        'SELECT role FROM group_members WHERE group_id = ? AND user_id = ?',
        [groupId, req.user.id]
      );

      if (members.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'No eres miembro de este grupo'
        });
      }

      const userRole = members[0].role;

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos suficientes en este grupo'
        });
      }

      req.groupRole = userRole;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware para verificar membresía en una expedición
 * @param {string[]} allowedRoles - Roles permitidos (owner, editor, viewer)
 */
function requireExpeditionMembership(allowedRoles = ['owner', 'editor', 'viewer']) {
  return async (req, res, next) => {
    try {
      const expeditionId = req.params.expeditionId || req.params.id;
      
      if (!expeditionId) {
        return res.status(400).json({
          success: false,
          message: 'ID de expedición requerido'
        });
      }

      // Verificar si es el owner de la expedición
      const [expeditions] = await pool.query(
        'SELECT owner_id, visibility, group_id FROM expeditions WHERE id = ?',
        [expeditionId]
      );

      if (expeditions.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Expedición no encontrada'
        });
      }

      const expedition = expeditions[0];

      // Si es el owner, tiene acceso total
      if (expedition.owner_id === req.user.id) {
        req.expeditionRole = 'owner';
        return next();
      }

      // Verificar membresía en la expedición
      const [members] = await pool.query(
        'SELECT role FROM expedition_members WHERE expedition_id = ? AND user_id = ?',
        [expeditionId, req.user.id]
      );

      if (members.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'No tienes acceso a esta expedición'
        });
      }

      const userRole = members[0].role;

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos suficientes en esta expedición'
        });
      }

      req.expeditionRole = userRole;
      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = {
  requireGroupMembership,
  requireExpeditionMembership
};
