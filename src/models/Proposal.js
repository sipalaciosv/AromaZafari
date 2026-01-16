const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Proposal {
  /**
   * Crear una nueva propuesta
   */
  static async create({ perfumeId, action, data, reason, proposedBy }) {
    const id = uuidv4();
    
    await pool.query(
      `INSERT INTO perfume_proposals (id, perfume_id, action, data, reason, proposed_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, perfumeId, action, JSON.stringify(data), reason, proposedBy]
    );
    return this.findById(id);
  }

  /**
   * Buscar propuesta por ID
   */
  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT pp.*, 
              p.nombre AS perfume_nombre, p.marca AS perfume_marca,
              u1.display_name AS proposed_by_name, u1.email AS proposed_by_email,
              u2.display_name AS reviewed_by_name
       FROM perfume_proposals pp
       LEFT JOIN perfumes p ON pp.perfume_id = p.id
       JOIN users u1 ON pp.proposed_by = u1.id
       LEFT JOIN users u2 ON pp.reviewed_by = u2.id
       WHERE pp.id = ?`,
      [id]
    );
    
    if (!rows[0]) return null;
    
    // Parsear JSON data
    rows[0].data = typeof rows[0].data === 'string' ? JSON.parse(rows[0].data) : rows[0].data;
    return rows[0];
  }

  /**
   * Obtener propuestas pendientes
   */
  static async getPending(limit = 50, offset = 0) {
    const [rows] = await pool.query(
      `SELECT pp.*, 
              p.nombre AS perfume_nombre, p.marca AS perfume_marca,
              u.display_name AS proposed_by_name, u.email AS proposed_by_email
       FROM perfume_proposals pp
       LEFT JOIN perfumes p ON pp.perfume_id = p.id
       JOIN users u ON pp.proposed_by = u.id
       WHERE pp.status = 'pending'
       ORDER BY pp.proposed_at ASC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    // Parsear JSON data
    return rows.map(row => ({
      ...row,
      data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data
    }));
  }

  /**
   * Obtener propuestas de un usuario
   */
  static async findByUser(userId, limit = 50, offset = 0) {
    const [rows] = await pool.query(
      `SELECT pp.*, 
              p.nombre AS perfume_nombre, p.marca AS perfume_marca
       FROM perfume_proposals pp
       LEFT JOIN perfumes p ON pp.perfume_id = p.id
       WHERE pp.proposed_by = ?
       ORDER BY pp.proposed_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    return rows.map(row => ({
      ...row,
      data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data
    }));
  }

  /**
   * Aprobar propuesta
   */
  static async approve(id, reviewedBy, reviewNotes = null) {
    await pool.query(
      `UPDATE perfume_proposals 
       SET status = 'approved', reviewed_by = ?, reviewed_at = NOW(), review_notes = ?
       WHERE id = ?`,
      [reviewedBy, reviewNotes, id]
    );
    return this.findById(id);
  }

  /**
   * Rechazar propuesta
   */
  static async reject(id, reviewedBy, reviewNotes = null) {
    await pool.query(
      `UPDATE perfume_proposals 
       SET status = 'rejected', reviewed_by = ?, reviewed_at = NOW(), review_notes = ?
       WHERE id = ?`,
      [reviewedBy, reviewNotes, id]
    );
    return this.findById(id);
  }

  /**
   * Contar propuestas pendientes
   */
  static async countPending() {
    const [rows] = await pool.query(
      "SELECT COUNT(*) as count FROM perfume_proposals WHERE status = 'pending'"
    );
    return rows[0].count;
  }
}

module.exports = Proposal;
