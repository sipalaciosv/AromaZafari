const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Expedition {
  /**
   * Crear una nueva expedición
   */
  static async create({ nombre, fecha, visibility, groupId, ownerId }) {
    const id = uuidv4();

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Crear expedición
      await connection.query(
        `INSERT INTO expeditions (id, nombre, fecha, visibility, group_id, owner_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, nombre, fecha, visibility, groupId, ownerId]
      );

      // Añadir owner como miembro
      await connection.query(
        `INSERT INTO expedition_members (id, expedition_id, user_id, role) VALUES (?, ?, ?, 'owner')`,
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
   * Buscar expedición por ID
   */
  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT e.*, u.display_name AS owner_name, u.photo_url AS owner_photo,
              g.name AS group_name,
              (SELECT COUNT(*) FROM expedition_items WHERE expedition_id = e.id) AS items_count,
              (SELECT COUNT(*) FROM expedition_members WHERE expedition_id = e.id) AS members_count
       FROM expeditions e
       JOIN users u ON e.owner_id = u.id
       LEFT JOIN \`groups\` g ON e.group_id = g.id
       WHERE e.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Obtener expediciones de un usuario
   */
  static async findByUserId(userId, filters = {}) {
    let query = `SELECT DISTINCT e.*, u.display_name AS owner_name, g.name AS group_name,
                        (SELECT COUNT(*) FROM expedition_items WHERE expedition_id = e.id) AS items_count
                 FROM expeditions e
                 JOIN users u ON e.owner_id = u.id
                 LEFT JOIN \`groups\` g ON e.group_id = g.id
                 LEFT JOIN expedition_members em ON e.id = em.expedition_id
                 WHERE (e.owner_id = ? OR em.user_id = ?)`;
    const params = [userId, userId];

    if (filters.estado) {
      query += ' AND e.estado = ?';
      params.push(filters.estado);
    }
    if (filters.visibility) {
      query += ' AND e.visibility = ?';
      params.push(filters.visibility);
    }

    query += ' ORDER BY e.fecha DESC';

    const [rows] = await pool.query(query, params);
    return rows;
  }

  /**
   * Obtener expediciones de un grupo
   */
  static async findByGroupId(groupId) {
    const [rows] = await pool.query(
      `SELECT e.*, u.display_name AS owner_name,
              (SELECT COUNT(*) FROM expedition_items WHERE expedition_id = e.id) AS items_count
       FROM expeditions e
       JOIN users u ON e.owner_id = u.id
       WHERE e.group_id = ? AND e.visibility = 'group'
       ORDER BY e.fecha DESC`,
      [groupId]
    );
    return rows;
  }

  /**
   * Actualizar expedición
   */
  static async update(id, { nombre, fecha, estado }) {
    const fields = [];
    const values = [];

    if (nombre !== undefined) {
      fields.push('nombre = ?');
      values.push(nombre);
    }
    if (fecha !== undefined) {
      fields.push('fecha = ?');
      values.push(fecha);
    }
    if (estado !== undefined) {
      fields.push('estado = ?');
      values.push(estado);
      if (estado === 'cerrada') {
        fields.push('closed_at = NOW()');
      }
    }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    await pool.query(
      `UPDATE expeditions SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return this.findById(id);
  }

  /**
   * Eliminar expedición
   */
  static async delete(id) {
    await pool.query('DELETE FROM expeditions WHERE id = ?', [id]);
    return true;
  }

  // ==================== MIEMBROS ====================

  /**
   * Obtener miembros de la expedición
   */
  static async getMembers(expeditionId) {
    const [rows] = await pool.query(
      `SELECT em.*, u.email, u.display_name, u.photo_url
       FROM expedition_members em
       JOIN users u ON em.user_id = u.id
       WHERE em.expedition_id = ?
       ORDER BY em.role, em.joined_at`,
      [expeditionId]
    );
    return rows;
  }

  /**
   * Añadir miembro
   */
  static async addMember(expeditionId, userId, role = 'viewer') {
    const id = uuidv4();
    await pool.query(
      `INSERT INTO expedition_members (id, expedition_id, user_id, role) VALUES (?, ?, ?, ?)`,
      [id, expeditionId, userId, role]
    );
    return { id, expeditionId, userId, role };
  }

  /**
   * Eliminar miembro
   */
  static async removeMember(expeditionId, userId) {
    await pool.query(
      'DELETE FROM expedition_members WHERE expedition_id = ? AND user_id = ?',
      [expeditionId, userId]
    );
    return true;
  }

  // ==================== ITEMS ====================

  /**
   * Obtener items de la expedición
   */
  static async getItems(expeditionId) {
    const [rows] = await pool.query(
      `SELECT ei.*, p.nombre AS perfume_nombre, p.marca AS perfume_marca, p.imagen_principal,
              u.display_name AS added_by_name,
              (SELECT COUNT(*) FROM expedition_item_notes WHERE item_id = ei.id) AS notes_count
       FROM expedition_items ei
       LEFT JOIN perfumes p ON ei.perfume_id = p.id
       JOIN users u ON ei.added_by = u.id
       WHERE ei.expedition_id = ?
       ORDER BY ei.added_at DESC`,
      [expeditionId]
    );
    return rows;
  }

  /**
   * Añadir item a la expedición
   */
  static async addItem(expeditionId, { perfumeId, nombreManual, addedBy }) {
    const id = uuidv4();
    await pool.query(
      `INSERT INTO expedition_items (id, expedition_id, perfume_id, nombre_manual, added_by)
       VALUES (?, ?, ?, ?, ?)`,
      [id, expeditionId, perfumeId, nombreManual, addedBy]
    );
    return this.getItemById(id);
  }

  /**
   * Obtener item por ID
   */
  static async getItemById(itemId) {
    const [rows] = await pool.query(
      `SELECT ei.*, p.nombre AS perfume_nombre, p.marca AS perfume_marca
       FROM expedition_items ei
       LEFT JOIN perfumes p ON ei.perfume_id = p.id
       WHERE ei.id = ?`,
      [itemId]
    );
    return rows[0] || null;
  }

  /**
   * Actualizar estado del item
   */
  static async updateItemStatus(itemId, status) {
    await pool.query(
      'UPDATE expedition_items SET status = ? WHERE id = ?',
      [status, itemId]
    );
    return this.getItemById(itemId);
  }

  /**
   * Eliminar item
   */
  static async removeItem(itemId) {
    await pool.query('DELETE FROM expedition_items WHERE id = ?', [itemId]);
    return true;
  }

  // ==================== NOTAS DE ITEMS ====================

  /**
   * Obtener notas de un item
   */
  static async getItemNotes(itemId) {
    const [rows] = await pool.query(
      `SELECT ein.*, u.display_name, u.photo_url
       FROM expedition_item_notes ein
       JOIN users u ON ein.user_id = u.id
       WHERE ein.item_id = ?
       ORDER BY ein.created_at DESC`,
      [itemId]
    );
    return rows;
  }

  /**
   * Añadir nota a un item
   */
  static async addItemNote(itemId, userId, nota, rating) {
    const id = uuidv4();
    await pool.query(
      `INSERT INTO expedition_item_notes (id, item_id, user_id, nota, rating) VALUES (?, ?, ?, ?, ?)`,
      [id, itemId, userId, nota, rating]
    );
    return { id, itemId, userId, nota, rating };
  }

  /**
   * Eliminar nota
   */
  static async removeItemNote(noteId) {
    await pool.query('DELETE FROM expedition_item_notes WHERE id = ?', [noteId]);
    return true;
  }
}

module.exports = Expedition;
