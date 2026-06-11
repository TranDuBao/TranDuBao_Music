const { query } = require('../config/db');

class Rating {
  static async rate(userId, trackId, rating) {
    const existing = await query('SELECT 1 FROM ratings WHERE user_id=? AND track_id=?', [userId, trackId]);
    if (existing.length > 0) {
      await query('UPDATE ratings SET rating=?, updated_at=CURRENT_TIMESTAMP WHERE user_id=? AND track_id=?',
        [rating, userId, trackId]);
    } else {
      await query('INSERT INTO ratings (user_id,track_id,rating) VALUES (?,?,?)', [userId, trackId, rating]);
    }
    return await Rating.getTrackRating(trackId);
  }
  static async getUserRating(userId, trackId) {
    const rows = await query('SELECT rating FROM ratings WHERE user_id=? AND track_id=?', [userId, trackId]);
    return rows[0]?.rating || 0;
  }
  static async getTrackRating(trackId) {
    const rows = await query(
      'SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM ratings WHERE track_id=?', [trackId]);
    return { avg: Math.round((rows[0]?.avg_rating || 0) * 10) / 10, count: rows[0]?.count || 0 };
  }
  static async getTopRated() {
    return await query(`
      SELECT t.id, t.title, t.artist, t.cover_url,
             AVG(r.rating) as avg_rating, COUNT(r.user_id) as rating_count
      FROM tracks t JOIN ratings r ON r.track_id = t.id
      GROUP BY t.id HAVING rating_count >= 1
      ORDER BY avg_rating DESC, rating_count DESC LIMIT 10`);
  }
}
module.exports = Rating;
