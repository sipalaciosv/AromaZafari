const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Vote {
  /**
   * Crear o actualizar voto
   */
  static async upsert({ perfumeId, userId, scope, groupId, calidad, proyeccion, duracion, parecido, comentario }) {
    const id = uuidv4();
    
    await pool.query(
      `INSERT INTO votes (id, perfume_id, user_id, scope, group_id, calidad, proyeccion, duracion, parecido, comentario)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         calidad = VALUES(calidad),
         proyeccion = VALUES(proyeccion),
         duracion = VALUES(duracion),
         parecido = VALUES(parecido),
         comentario = VALUES(comentario),
         updated_at = NOW()`,
      [id, perfumeId, userId, scope, groupId, calidad, proyeccion, duracion, parecido, comentario]
    );

    return this.findByUserAndPerfume(userId, perfumeId, scope, groupId);
  }

  /**
   * Buscar voto de un usuario para un perfume
   */
  static async findByUserAndPerfume(userId, perfumeId, scope = 'global', groupId = null) {
    let query = 'SELECT * FROM votes WHERE user_id = ? AND perfume_id = ? AND scope = ?';
    const params = [userId, perfumeId, scope];

    if (scope === 'group') {
      query += ' AND group_id = ?';
      params.push(groupId);
    }

    const [rows] = await pool.query(query, params);
    return rows[0] || null;
  }

  /**
   * Obtener votos de un perfume
   */
  static async findByPerfume(perfumeId, scope = 'global', groupId = null, limit = 50, offset = 0) {
    let query = `SELECT v.*, u.display_name, u.photo_url
                 FROM votes v
                 JOIN users u ON v.user_id = u.id
                 WHERE v.perfume_id = ? AND v.scope = ?`;
    const params = [perfumeId, scope];

    if (scope === 'group') {
      query += ' AND v.group_id = ?';
      params.push(groupId);
    }

    query += ' ORDER BY v.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);
    return rows;
  }

  /**
   * Obtener votos de un usuario
   */
  static async findByUser(userId, limit = 50, offset = 0) {
    const [rows] = await pool.query(
      `SELECT v.*, p.nombre AS perfume_nombre, p.marca AS perfume_marca, p.imagen_principal
       FROM votes v
       JOIN perfumes p ON v.perfume_id = p.id
       WHERE v.user_id = ?
       ORDER BY v.updated_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );
    return rows;
  }

  /**
   * Obtener estadísticas de votos de un perfume
   */
  static async getStats(perfumeId, scope = 'global', groupId = null) {
    let query = `SELECT 
                   COUNT(*) as total_votes,
                   ROUND(AVG(calidad), 2) as avg_calidad,
                   ROUND(AVG(proyeccion), 2) as avg_proyeccion,
                   ROUND(AVG(duracion), 2) as avg_duracion,
                   ROUND(AVG(parecido), 2) as avg_parecido
                 FROM votes WHERE perfume_id = ? AND scope = ?`;
    const params = [perfumeId, scope];

    if (scope === 'group') {
      query += ' AND group_id = ?';
      params.push(groupId);
    }

    const [rows] = await pool.query(query, params);
    return rows[0];
  }

  /**
   * Eliminar voto
   */
  static async delete(userId, perfumeId, scope = 'global', groupId = null) {
    let query = 'DELETE FROM votes WHERE user_id = ? AND perfume_id = ? AND scope = ?';
    const params = [userId, perfumeId, scope];

    if (scope === 'group') {
      query += ' AND group_id = ?';
      params.push(groupId);
    }

    await pool.query(query, params);
    return true;
  }

  /**
   * Buscar voto por ID
   */
  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM votes WHERE id = ?', [id]);
    return rows[0] || null;
  }

  /**
   * Actualizar voto por ID
   */
  static async update(id, userId, { calidad, proyeccion, duracion, parecido, comentario }) {
    // Verificar que el voto pertenece al usuario
    const vote = await this.findById(id);
    if (!vote || vote.user_id !== userId) {
      return null;
    }

    const fields = [];
    const values = [];

    if (calidad !== undefined) {
      fields.push('calidad = ?');
      values.push(calidad);
    }
    if (proyeccion !== undefined) {
      fields.push('proyeccion = ?');
      values.push(proyeccion);
    }
    if (duracion !== undefined) {
      fields.push('duracion = ?');
      values.push(duracion);
    }
    if (parecido !== undefined) {
      fields.push('parecido = ?');
      values.push(parecido);
    }
    if (comentario !== undefined) {
      fields.push('comentario = ?');
      values.push(comentario);
    }

    if (fields.length === 0) return vote;

    values.push(id);
    await pool.query(
      `UPDATE votes SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  /**
   * Eliminar voto por ID
   */
  static async deleteById(id, userId) {
    // Verificar que el voto pertenece al usuario
    const vote = await this.findById(id);
    if (!vote || vote.user_id !== userId) {
      return false;
    }

    await pool.query('DELETE FROM votes WHERE id = ?', [id]);
    return true;
  }

  /**
   * Obtener votos de un grupo
   */
  static async findByGroup(groupId, limit = 50, offset = 0) {
    const [rows] = await pool.query(
      `SELECT v.*, u.display_name, u.photo_url, 
              p.nombre AS perfume_nombre, p.marca AS perfume_marca, p.imagen_principal
       FROM votes v
       JOIN users u ON v.user_id = u.id
       JOIN perfumes p ON v.perfume_id = p.id
       WHERE v.scope = 'group' AND v.group_id = ?
       ORDER BY v.updated_at DESC
       LIMIT ? OFFSET ?`,
      [groupId, limit, offset]
    );
    return rows;
  }
}

module.exports = Vote;
