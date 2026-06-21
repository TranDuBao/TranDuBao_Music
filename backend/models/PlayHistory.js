const { query, dbType } = require('../config/db');

class PlayHistory {
  static async record(userId, trackId) {
    // Insert history using UTC (CURRENT_TIMESTAMP / datetime('now'))
    const timeExpr = dbType === 'mysql' ? 'CURRENT_TIMESTAMP' : "datetime('now')";
    await query(
      `INSERT INTO play_history (user_id, track_id, played_at) VALUES (?, ?, ${timeExpr})`,
      [userId, trackId]
    );
    // Increment track play_count
    await query('UPDATE tracks SET play_count = play_count + 1 WHERE id=?', [trackId]);
  }
  static async getUser(userId, limit = 50) {
    const playedAtVn = dbType === 'mysql'
      ? "DATE_ADD(ph.played_at, INTERVAL 7 HOUR)"
      : "datetime(ph.played_at, '+7 hours')";
    return await query(`
      SELECT ph.id, ${playedAtVn} as played_at, t.id as track_id, t.title, t.artist, t.album, t.cover_url, t.audio_url, t.duration, t.genre
      FROM play_history ph
      JOIN tracks t ON ph.track_id = t.id
      WHERE ph.user_id = ?
      ORDER BY ph.played_at DESC LIMIT ?`, [userId, limit]);
  }
  static async getRecentGlobal(limit = 20) {
    const playedAtVn = dbType === 'mysql'
      ? "DATE_ADD(ph.played_at, INTERVAL 7 HOUR)"
      : "datetime(ph.played_at, '+7 hours')";
    return await query(`
      SELECT ${playedAtVn} as played_at, t.title, t.artist, u.name as user_name
      FROM play_history ph
      JOIN tracks t ON ph.track_id = t.id
      LEFT JOIN users u ON ph.user_id = u.id
      ORDER BY ph.played_at DESC LIMIT ?`, [limit]);
  }
  static async getDailyStats(days = 7) {
    const playedAtVn = dbType === 'mysql'
      ? "DATE_ADD(played_at, INTERVAL 7 HOUR)"
      : "datetime(played_at, '+7 hours')";
    const dayExpr = `DATE(${playedAtVn})`;
    const thresholdExpr = dbType === 'mysql'
      ? `DATE_SUB(DATE(DATE_ADD(NOW(), INTERVAL 7 HOUR)), INTERVAL ${days} DAY)`
      : `date('now', '+7 hours', '-${days} days')`;
    return await query(`
      SELECT ${dayExpr} as day, COUNT(*) as count
      FROM play_history
      WHERE DATE(${playedAtVn}) >= ${thresholdExpr}
      GROUP BY day ORDER BY day`);
  }
}
module.exports = PlayHistory;
