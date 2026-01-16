const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class User {
  /**
   * Crear un nuevo usuario
   */
  static async create({ id, email, displayName, photoUrl, authProvider }) {
    const userId = id || uuidv4();
    await pool.query(
      `INSERT INTO users (id, email, display_name, photo_url, auth_provider) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, email, displayName, photoUrl, authProvider || 'google']
    );
    return this.findById(userId);
  }

  /**
   * Buscar usuario por ID
   */
  static async findById(id) {
    const [rows] = await pool.query(
      'SELECT id, email, display_name, photo_url, is_moderator, auth_provider, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Buscar usuario por email
   */
  static async findByEmail(email) {
    const [rows] = await pool.query(
      'SELECT id, email, display_name, photo_url, is_moderator, auth_provider, created_at FROM users WHERE email = ?',
      [email]
    );
    return rows[0] || null;
  }

  /**
   * Actualizar usuario
   */
  static async update(id, { displayName, photoUrl }) {
    const fields = [];
    const values = [];

    if (displayName !== undefined) {
      fields.push('display_name = ?');
      values.push(displayName);
    }
    if (photoUrl !== undefined) {
      fields.push('photo_url = ?');
      values.push(photoUrl);
    }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return this.findById(id);
  }

  /**
   * Obtener todos los moderadores
   */
  static async getModerators() {
    const [rows] = await pool.query(
      'SELECT id, email, display_name, photo_url FROM users WHERE is_moderator = TRUE'
    );
    return rows;
  }

  /**
   * Establecer rol de moderador
   */
  static async setModerator(id, isModerator) {
    await pool.query(
      'UPDATE users SET is_moderator = ? WHERE id = ?',
      [isModerator, id]
    );
    return this.findById(id);
  }
}

module.exports = User;
