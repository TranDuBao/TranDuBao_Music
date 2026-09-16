const { query } = require('../config/db');

class Favorite {
  static async getUserFavorites(userId) {
    return await query(`
      SELECT t.*, u.name as uploader_name, 1 as is_favorite
      FROM favorites f
      JOIN tracks t ON f.track_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE f.user_id = ?
      AND (t.status = 'approved' OR t.status IS NULL)
      ORDER BY f.created_at DESC`, [userId]);
  }
  static async toggle(userId, trackId) {
    const existing = await query('SELECT 1 FROM favorites WHERE user_id=? AND track_id=?', [userId, trackId]);
    if (existing.length > 0) {
      await query('DELETE FROM favorites WHERE user_id=? AND track_id=?', [userId, trackId]);
      return { favorited: false };
    } else {
      await query('INSERT INTO favorites (user_id,track_id) VALUES (?,?)', [userId, trackId]);
      return { favorited: true };
    }
  }
  static async isFavorite(userId, trackId) {
    const rows = await query('SELECT 1 FROM favorites WHERE user_id=? AND track_id=?', [userId, trackId]);
    return rows.length > 0;
  }
  static async getStats() {
    return await query(`
      SELECT t.id, t.title, t.artist, t.cover_url, t.audio_url, t.duration, COUNT(f.user_id) as favorite_count
      FROM tracks t
      JOIN favorites f ON f.track_id = t.id
      WHERE (t.status = 'approved' OR t.status IS NULL)
      GROUP BY t.id, t.title, t.artist, t.cover_url, t.audio_url, t.duration
      ORDER BY favorite_count DESC`);
  }
}
module.exports = Favorite;
