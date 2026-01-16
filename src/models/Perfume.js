const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Perfume {
  /**
   * Generar slug único
   */
  static generateSlug(nombre, marca) {
    const base = `${marca || ''} ${nombre}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return `${base}-${Date.now().toString(36)}`;
  }

  /**
   * Crear un nuevo perfume
   */
  static async create({ tipo, parentId, nombre, marca, ml, imagenPrincipal, urlFragrantica, createdBy, status = 'pending' }) {
    const id = uuidv4();
    const slug = this.generateSlug(nombre, marca);

    await pool.query(
      `INSERT INTO perfumes (id, tipo, parent_id, nombre, marca, ml, imagen_principal, url_fragrantica, slug, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, tipo, parentId, nombre, marca, ml, imagenPrincipal, urlFragrantica, slug, status, createdBy]
    );
    return this.findById(id);
  }

  /**
   * Buscar perfume por ID
   */
  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT p.*, 
              parent.nombre AS parent_nombre, parent.marca AS parent_marca,
              u.display_name AS created_by_name
       FROM perfumes p
       LEFT JOIN perfumes parent ON p.parent_id = parent.id
       JOIN users u ON p.created_by = u.id
       WHERE p.id = ?`,
      [id]
    );
    
    if (!rows[0]) return null;

    // Obtener tags
    const [tags] = await pool.query(
      'SELECT tag FROM perfume_tags WHERE perfume_id = ?',
      [id]
    );

    // Obtener URLs
    const [urls] = await pool.query(
      'SELECT tipo, url FROM perfume_urls WHERE perfume_id = ?',
      [id]
    );

    return {
      ...rows[0],
      tags: tags.map(t => t.tag),
      urls
    };
  }

  /**
   * Buscar perfume por slug
   */
  static async findBySlug(slug) {
    const [rows] = await pool.query(
      'SELECT id FROM perfumes WHERE slug = ?',
      [slug]
    );
    if (!rows[0]) return null;
    return this.findById(rows[0].id);
  }

  /**
   * Buscar perfumes con filtros
   */
  static async search({ tipo, marca, search, status = 'approved', parentId, limit = 20, offset = 0 }) {
    let query = `SELECT p.id, p.tipo, p.nombre, p.marca, p.ml, p.imagen_principal, p.slug,
                        p.avg_parecido, p.avg_calidad, p.avg_duracion, p.avg_proyeccion, p.votes_count,
                        parent.nombre AS parent_nombre, parent.marca AS parent_marca
                 FROM perfumes p
                 LEFT JOIN perfumes parent ON p.parent_id = parent.id
                 WHERE p.status = ?`;
    const params = [status];

    if (tipo) {
      query += ' AND p.tipo = ?';
      params.push(tipo);
    }
    if (marca) {
      query += ' AND p.marca = ?';
      params.push(marca);
    }
    if (parentId) {
      query += ' AND p.parent_id = ?';
      params.push(parentId);
    }
    if (search) {
      query += ' AND MATCH(p.nombre, p.marca) AGAINST(? IN NATURAL LANGUAGE MODE)';
      params.push(search);
    }

    query += ' ORDER BY p.votes_count DESC, p.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);

    // Contar total
    let countQuery = 'SELECT COUNT(*) as total FROM perfumes p WHERE p.status = ?';
    const countParams = [status];

    if (tipo) {
      countQuery += ' AND p.tipo = ?';
      countParams.push(tipo);
    }
    if (marca) {
      countQuery += ' AND p.marca = ?';
      countParams.push(marca);
    }
    if (parentId) {
      countQuery += ' AND p.parent_id = ?';
      countParams.push(parentId);
    }

    const [countResult] = await pool.query(countQuery, countParams);

    return {
      data: rows,
      total: countResult[0].total,
      limit,
      offset
    };
  }

  /**
   * Obtener dupes de un perfume original
   */
  static async getDupes(parentId) {
    const [rows] = await pool.query(
      `SELECT p.*, u.display_name AS created_by_name
       FROM perfumes p
       JOIN users u ON p.created_by = u.id
       WHERE p.parent_id = ? AND p.status = 'approved'
       ORDER BY p.avg_parecido DESC, p.votes_count DESC`,
      [parentId]
    );
    return rows;
  }

  /**
   * Obtener marcas únicas
   */
  static async getBrands() {
    const [rows] = await pool.query(
      `SELECT DISTINCT marca FROM perfumes WHERE marca IS NOT NULL AND status = 'approved' ORDER BY marca`
    );
    return rows.map(r => r.marca);
  }

  /**
   * Actualizar perfume
   */
  static async update(id, { nombre, marca, ml, imagenPrincipal, urlFragrantica }) {
    const fields = [];
    const values = [];

    if (nombre !== undefined) {
      fields.push('nombre = ?');
      values.push(nombre);
    }
    if (marca !== undefined) {
      fields.push('marca = ?');
      values.push(marca);
    }
    if (ml !== undefined) {
      fields.push('ml = ?');
      values.push(ml);
    }
    if (imagenPrincipal !== undefined) {
      fields.push('imagen_principal = ?');
      values.push(imagenPrincipal);
    }
    if (urlFragrantica !== undefined) {
      fields.push('url_fragrantica = ?');
      values.push(urlFragrantica);
    }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    await pool.query(
      `UPDATE perfumes SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return this.findById(id);
  }

  /**
   * Aprobar perfume
   */
  static async approve(id, approvedBy) {
    await pool.query(
      `UPDATE perfumes SET status = 'approved', approved_by = ?, approved_at = NOW() WHERE id = ?`,
      [approvedBy, id]
    );
    return this.findById(id);
  }

  /**
   * Rechazar perfume
   */
  static async reject(id) {
    await pool.query(
      `UPDATE perfumes SET status = 'rejected' WHERE id = ?`,
      [id]
    );
    return this.findById(id);
  }

  /**
   * Añadir tag
   */
  static async addTag(perfumeId, tag) {
    const id = uuidv4();
    await pool.query(
      'INSERT IGNORE INTO perfume_tags (id, perfume_id, tag) VALUES (?, ?, ?)',
      [id, perfumeId, tag]
    );
    return true;
  }

  /**
   * Eliminar tag
   */
  static async removeTag(perfumeId, tag) {
    await pool.query(
      'DELETE FROM perfume_tags WHERE perfume_id = ? AND tag = ?',
      [perfumeId, tag]
    );
    return true;
  }

  /**
   * Añadir URL
   */
  static async addUrl(perfumeId, tipo, url) {
    const id = uuidv4();
    await pool.query(
      'INSERT INTO perfume_urls (id, perfume_id, tipo, url) VALUES (?, ?, ?, ?)',
      [id, perfumeId, tipo, url]
    );
    return true;
  }

  /**
   * Eliminar URL
   */
  static async removeUrl(urlId) {
    await pool.query('DELETE FROM perfume_urls WHERE id = ?', [urlId]);
    return true;
  }

  /**
   * Eliminar perfume
   */
  static async delete(id) {
    await pool.query('DELETE FROM perfumes WHERE id = ?', [id]);
    return true;
  }

  /**
   * Obtener tags populares
   */
  static async getPopularTags(limit = 20) {
    const [rows] = await pool.query(
      `SELECT tag, COUNT(*) as count 
       FROM perfume_tags 
       GROUP BY tag 
       ORDER BY count DESC 
       LIMIT ?`,
      [limit]
    );
    return rows;
  }
}

module.exports = Perfume;
