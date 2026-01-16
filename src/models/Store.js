const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Store {
  /**
   * Crear una nueva tienda
   */
  static async create({ groupId, nombre, tipo, direccion, url, createdBy }) {
    const id = uuidv4();

    await pool.query(
      `INSERT INTO group_stores (id, group_id, nombre, tipo, direccion, url, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, groupId, nombre, tipo, direccion, url, createdBy]
    );
    return this.findById(id);
  }

  /**
   * Buscar tienda por ID
   */
  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT gs.*, u.display_name AS created_by_name, g.name AS group_name
       FROM group_stores gs
       JOIN users u ON gs.created_by = u.id
       JOIN \`groups\` g ON gs.group_id = g.id
       WHERE gs.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Obtener tiendas de un grupo
   */
  static async findByGroupId(groupId) {
    const [rows] = await pool.query(
      `SELECT gs.*, u.display_name AS created_by_name
       FROM group_stores gs
       JOIN users u ON gs.created_by = u.id
       WHERE gs.group_id = ?
       ORDER BY gs.tipo, gs.nombre`,
      [groupId]
    );
    return rows;
  }

  /**
   * Actualizar tienda
   */
  static async update(id, { nombre, tipo, direccion, url }) {
    const fields = [];
    const values = [];

    if (nombre !== undefined) {
      fields.push('nombre = ?');
      values.push(nombre);
    }
    if (tipo !== undefined) {
      fields.push('tipo = ?');
      values.push(tipo);
    }
    if (direccion !== undefined) {
      fields.push('direccion = ?');
      values.push(direccion);
    }
    if (url !== undefined) {
      fields.push('url = ?');
      values.push(url);
    }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    await pool.query(
      `UPDATE group_stores SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return this.findById(id);
  }

  /**
   * Eliminar tienda
   */
  static async delete(id) {
    await pool.query('DELETE FROM group_stores WHERE id = ?', [id]);
    return true;
  }
}

module.exports = Store;
