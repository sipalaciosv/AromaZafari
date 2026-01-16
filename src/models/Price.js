const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Price {
  /**
   * Crear o actualizar precio
   */
  static async upsert({ groupId, perfumeId, storeId, precio, agotado, nota, updatedBy }) {
    const id = uuidv4();

    await pool.query(
      `INSERT INTO group_perfume_prices (id, group_id, perfume_id, store_id, precio, agotado, nota, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         precio = VALUES(precio),
         agotado = VALUES(agotado),
         nota = VALUES(nota),
         updated_by = VALUES(updated_by)`,
      [id, groupId, perfumeId, storeId, precio, agotado || false, nota, updatedBy]
    );

    return this.findByIds(groupId, perfumeId, storeId);
  }

  /**
   * Buscar precio específico
   */
  static async findByIds(groupId, perfumeId, storeId) {
    const [rows] = await pool.query(
      `SELECT gpp.*, 
              p.nombre AS perfume_nombre, p.marca AS perfume_marca,
              gs.nombre AS store_nombre, gs.tipo AS store_tipo,
              u.display_name AS updated_by_name
       FROM group_perfume_prices gpp
       JOIN perfumes p ON gpp.perfume_id = p.id
       JOIN group_stores gs ON gpp.store_id = gs.id
       JOIN users u ON gpp.updated_by = u.id
       WHERE gpp.group_id = ? AND gpp.perfume_id = ? AND gpp.store_id = ?`,
      [groupId, perfumeId, storeId]
    );
    return rows[0] || null;
  }

  /**
   * Obtener precios de un perfume en un grupo
   */
  static async findByPerfume(groupId, perfumeId) {
    const [rows] = await pool.query(
      `SELECT gpp.*, 
              gs.nombre AS store_nombre, gs.tipo AS store_tipo,
              u.display_name AS updated_by_name
       FROM group_perfume_prices gpp
       JOIN group_stores gs ON gpp.store_id = gs.id
       JOIN users u ON gpp.updated_by = u.id
       WHERE gpp.group_id = ? AND gpp.perfume_id = ?
       ORDER BY gpp.precio ASC`,
      [groupId, perfumeId]
    );
    return rows;
  }

  /**
   * Obtener precios de una tienda
   */
  static async findByStore(storeId) {
    const [rows] = await pool.query(
      `SELECT gpp.*, 
              p.nombre AS perfume_nombre, p.marca AS perfume_marca, p.imagen_principal,
              u.display_name AS updated_by_name
       FROM group_perfume_prices gpp
       JOIN perfumes p ON gpp.perfume_id = p.id
       JOIN users u ON gpp.updated_by = u.id
       WHERE gpp.store_id = ?
       ORDER BY p.nombre`,
      [storeId]
    );
    return rows;
  }

  /**
   * Obtener todos los precios de un grupo
   */
  static async findByGroup(groupId, filters = {}) {
    let query = `SELECT gpp.*, 
                        p.nombre AS perfume_nombre, p.marca AS perfume_marca, p.imagen_principal,
                        gs.nombre AS store_nombre, gs.tipo AS store_tipo
                 FROM group_perfume_prices gpp
                 JOIN perfumes p ON gpp.perfume_id = p.id
                 JOIN group_stores gs ON gpp.store_id = gs.id
                 WHERE gpp.group_id = ?`;
    const params = [groupId];

    if (filters.agotado !== undefined) {
      query += ' AND gpp.agotado = ?';
      params.push(filters.agotado);
    }
    if (filters.storeId) {
      query += ' AND gpp.store_id = ?';
      params.push(filters.storeId);
    }

    query += ' ORDER BY p.nombre, gpp.precio';

    const [rows] = await pool.query(query, params);
    return rows;
  }

  /**
   * Obtener historial de precios
   */
  static async getHistory(perfumeId, storeId, limit = 30) {
    const [rows] = await pool.query(
      `SELECT ph.*, u.display_name AS recorded_by_name
       FROM price_history ph
       JOIN users u ON ph.recorded_by = u.id
       WHERE ph.perfume_id = ? AND ph.store_id = ?
       ORDER BY ph.recorded_at DESC
       LIMIT ?`,
      [perfumeId, storeId, limit]
    );
    return rows;
  }

  /**
   * Eliminar precio
   */
  static async delete(groupId, perfumeId, storeId) {
    await pool.query(
      'DELETE FROM group_perfume_prices WHERE group_id = ? AND perfume_id = ? AND store_id = ?',
      [groupId, perfumeId, storeId]
    );
    return true;
  }

  /**
   * Obtener precio más bajo de un perfume
   */
  static async getLowestPrice(perfumeId, groupId = null) {
    let query = `SELECT gpp.*, gs.nombre AS store_nombre, g.name AS group_name
                 FROM group_perfume_prices gpp
                 JOIN group_stores gs ON gpp.store_id = gs.id
                 JOIN \`groups\` g ON gpp.group_id = g.id
                 WHERE gpp.perfume_id = ? AND gpp.agotado = FALSE`;
    const params = [perfumeId];

    if (groupId) {
      query += ' AND gpp.group_id = ?';
      params.push(groupId);
    }

    query += ' ORDER BY gpp.precio ASC LIMIT 1';

    const [rows] = await pool.query(query, params);
    return rows[0] || null;
  }
}

module.exports = Price;
