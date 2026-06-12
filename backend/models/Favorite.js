const { query } = require('../config/db');

class Favorite {
  static async getUserFavorites(userId) {
    return await query(`
      SELECT t.*, u.name as uploader_name, 1 as is_favorite
      FROM favorites f
      JOIN tracks t ON f.track_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE f.user_id = ?
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
      SELECT t.id, t.title, t.artist, COUNT(f.user_id) as favorite_count
      FROM tracks t LEFT JOIN favorites f ON f.track_id = t.id
      GROUP BY t.id, t.title, t.artist ORDER BY favorite_count DESC LIMIT 10`);
  }
}
module.exports = Favorite;
