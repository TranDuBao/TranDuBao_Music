const { query } = require('../config/db');

class Track {
  static async getAll(search = '', userId = null, showMine = false, categoryId = null) {
    let sql, params = [];

    // Base query selects track info, uploader info, and category info
    let selectClause = `
      SELECT t.*, u.name as uploader_name, c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM tracks t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE 1=1
    `;

    // Filter by ownership/publicity
    if (showMine && userId) {
      selectClause += ` AND t.user_id = ? `;
      params.push(userId);
    } else {
      selectClause += ` AND (t.is_public = 1 OR t.user_id = ?) `;
      params.push(userId || -1);
    }

    // Filter by category if provided
    if (categoryId) {
      selectClause += ` AND t.category_id = ? `;
      params.push(Number(categoryId));
    }

    // Search filter
    if (search) {
      selectClause += ` AND (t.title LIKE ? OR t.artist LIKE ? OR t.genre LIKE ? OR c.name LIKE ?) `;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    selectClause += ` ORDER BY t.id DESC `;

    return await query(selectClause, params);
  }

  static async getById(id) {
    const rows = await query(`
      SELECT t.*, u.name as uploader_name, c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM tracks t 
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?`, [id]);
    return rows[0] || null;
  }

  static async create({ title, artist, album, duration, cover_url, audio_url, genre, user_id = null, is_public = 1, category_id = null }) {
    const catId = (category_id === '' || category_id === undefined || category_id === null) ? null : Number(category_id);
    const sql = `
      INSERT INTO tracks (title, artist, album, duration, cover_url, audio_url, genre, user_id, is_public, category_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      title, artist, album || 'Single',
      duration || 180,
      cover_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500',
      audio_url, genre || 'Other', user_id, is_public, catId
    ]);
    return await Track.getById(result.insertId);
  }

  static async update(id, data) {
    const existing = await Track.getById(id);
    if (!existing) return null;

    const title = data.title !== undefined ? data.title : existing.title;
    const artist = data.artist !== undefined ? data.artist : existing.artist;
    const album = data.album !== undefined ? data.album : existing.album;
    const duration = data.duration !== undefined ? data.duration : existing.duration;
    const cover_url = data.cover_url !== undefined ? data.cover_url : existing.cover_url;
    const audio_url = data.audio_url !== undefined ? data.audio_url : existing.audio_url;
    const genre = data.genre !== undefined ? data.genre : existing.genre;
    const is_public = data.is_public !== undefined ? data.is_public : existing.is_public;
    
    let category_id = existing.category_id;
    if (data.category_id !== undefined) {
      category_id = (data.category_id === '' || data.category_id === null) ? null : Number(data.category_id);
    }

    await query(
      'UPDATE tracks SET title=?, artist=?, album=?, duration=?, cover_url=?, audio_url=?, genre=?, is_public=?, category_id=? WHERE id=?',
      [title, artist, album, duration, cover_url, audio_url, genre, is_public ?? 1, category_id, id]
    );
    return await Track.getById(id);
  }

  static async delete(id) {
    return await query('DELETE FROM tracks WHERE id = ?', [id]);
  }

  static async isOwner(trackId, userId) {
    const rows = await query('SELECT user_id FROM tracks WHERE id = ?', [trackId]);
    if (!rows[0]) return false;
    return rows[0].user_id === userId || rows[0].user_id === null;
  }
}

module.exports = Track;
