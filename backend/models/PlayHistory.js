const { query, dbType } = require('../config/db');

class PlayHistory {
  static async record(userId, trackId) {
    // Insert history with Vietnam time (UTC+7)
    const timeExpr = dbType === 'mysql' ? 'DATE_ADD(UTC_TIMESTAMP(), INTERVAL 7 HOUR)' : "datetime('now', '+7 hours')";
    await query(
      `INSERT INTO play_history (user_id, track_id, played_at) VALUES (?, ?, ${timeExpr})`,
      [userId, trackId]
    );
    // Increment track play_count
    await query('UPDATE tracks SET play_count = play_count + 1 WHERE id=?', [trackId]);
  }
  static async getUser(userId, limit = 50) {
    return await query(`
      SELECT ph.id, ph.played_at, t.id as track_id, t.title, t.artist, t.album, t.cover_url, t.audio_url, t.duration, t.genre
      FROM play_history ph
      JOIN tracks t ON ph.track_id = t.id
      WHERE ph.user_id = ?
      ORDER BY ph.played_at DESC LIMIT ?`, [userId, limit]);
  }
  static async getRecentGlobal(limit = 20) {
    return await query(`
      SELECT ph.played_at, t.title, t.artist, u.name as user_name
      FROM play_history ph
      JOIN tracks t ON ph.track_id = t.id
      LEFT JOIN users u ON ph.user_id = u.id
      ORDER BY ph.played_at DESC LIMIT ?`, [limit]);
  }
  static async getDailyStats(days = 7) {
    const timeExpr = dbType === 'mysql' 
      ? `DATE_SUB(NOW(), INTERVAL ${days} DAY)` 
      : `datetime('now', '-${days} days')`;
    const dayExpr = dbType === 'mysql' ? 'DATE(played_at)' : 'date(played_at)';
    return await query(`
      SELECT ${dayExpr} as day, COUNT(*) as count
      FROM play_history
      WHERE played_at >= ${timeExpr}
      GROUP BY day ORDER BY day`);
  }
}
module.exports = PlayHistory;
