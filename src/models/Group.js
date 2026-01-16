const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Group {
  /**
   * Generar código de invitación único
   */
  static generateInviteCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Crear un nuevo grupo
   */
  static async create({ name, description, ownerId, publicRead, publicSlug }) {
    const id = uuidv4();
    const inviteCode = this.generateInviteCode();

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Crear grupo
      await connection.query(
        `INSERT INTO \`groups\` (id, name, description, owner_id, invite_code, public_read, public_slug) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, name, description, ownerId, inviteCode, publicRead || false, publicSlug]
      );

      // Añadir owner como miembro
      await connection.query(
        `INSERT INTO group_members (id, group_id, user_id, role) VALUES (?, ?, ?, 'owner')`,
        [uuidv4(), id, ownerId]
      );

      await connection.commit();
      return this.findById(id);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Buscar grupo por ID
   */
  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT g.*, u.display_name as owner_name, u.photo_url as owner_photo,
              (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as members_count
       FROM \`groups\` g
       JOIN users u ON g.owner_id = u.id
       WHERE g.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Buscar grupo por código de invitación
   */
  static async findByInviteCode(code) {
    const [rows] = await pool.query(
      `SELECT g.*, u.display_name as owner_name
       FROM \`groups\` g
       JOIN users u ON g.owner_id = u.id
       WHERE g.invite_code = ?`,
      [code]
    );
    return rows[0] || null;
  }

  /**
   * Buscar grupo por slug público
   */
  static async findBySlug(slug) {
    const [rows] = await pool.query(
      `SELECT g.*, u.display_name as owner_name
       FROM \`groups\` g
       JOIN users u ON g.owner_id = u.id
       WHERE g.public_slug = ? AND g.public_read = TRUE`,
      [slug]
    );
    return rows[0] || null;
  }

  /**
   * Obtener grupos de un usuario
   */
  static async findByUserId(userId) {
    const [rows] = await pool.query(
      `SELECT g.*, gm.role as user_role, u.display_name as owner_name,
              (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as members_count
       FROM \`groups\` g
       JOIN group_members gm ON g.id = gm.group_id
       JOIN users u ON g.owner_id = u.id
       WHERE gm.user_id = ?
       ORDER BY gm.joined_at DESC`,
      [userId]
    );
    return rows;
  }

  /**
   * Actualizar grupo
   */
  static async update(id, { name, description, publicRead, publicSlug }) {
    const fields = [];
    const values = [];

    if (name !== undefined) {
      fields.push('name = ?');
      values.push(name);
    }
    if (description !== undefined) {
      fields.push('description = ?');
      values.push(description);
    }
    if (publicRead !== undefined) {
      fields.push('public_read = ?');
      values.push(publicRead);
    }
    if (publicSlug !== undefined) {
      fields.push('public_slug = ?');
      values.push(publicSlug);
    }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    await pool.query(
      `UPDATE \`groups\` SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return this.findById(id);
  }

  /**
   * Regenerar código de invitación
   */
  static async regenerateInviteCode(id) {
    const newCode = this.generateInviteCode();
    await pool.query(
      'UPDATE `groups` SET invite_code = ? WHERE id = ?',
      [newCode, id]
    );
    return newCode;
  }

  /**
   * Eliminar grupo
   */
  static async delete(id) {
    await pool.query('DELETE FROM `groups` WHERE id = ?', [id]);
    return true;
  }

  /**
   * Obtener miembros del grupo
   */
  static async getMembers(groupId) {
    const [rows] = await pool.query(
      `SELECT gm.*, u.email, u.display_name, u.photo_url
       FROM group_members gm
       JOIN users u ON gm.user_id = u.id
       WHERE gm.group_id = ?
       ORDER BY gm.role, gm.joined_at`,
      [groupId]
    );
    return rows;
  }

  /**
   * Añadir miembro al grupo
   */
  static async addMember(groupId, userId, role = 'member') {
    const id = uuidv4();
    await pool.query(
      `INSERT INTO group_members (id, group_id, user_id, role) VALUES (?, ?, ?, ?)`,
      [id, groupId, userId, role]
    );
    return { id, groupId, userId, role };
  }

  /**
   * Actualizar rol de miembro
   */
  static async updateMemberRole(groupId, userId, role) {
    await pool.query(
      'UPDATE group_members SET role = ? WHERE group_id = ? AND user_id = ?',
      [role, groupId, userId]
    );
    return true;
  }

  /**
   * Eliminar miembro del grupo
   */
  static async removeMember(groupId, userId) {
    await pool.query(
      'DELETE FROM group_members WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    );
    return true;
  }
}

module.exports = Group;
