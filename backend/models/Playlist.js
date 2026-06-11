const { query } = require('../config/db');

class Playlist {
  static async getByUserId(userId) {
    return await query('SELECT * FROM playlists WHERE user_id = ? ORDER BY id DESC', [userId]);
  }

  static async getById(id) {
    const rows = await query('SELECT * FROM playlists WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async create({ name, description, userId }) {
    const result = await query('INSERT INTO playlists (name, description, user_id) VALUES (?, ?, ?)', [
      name,
      description || '',
      userId
    ]);
    return { id: result.insertId || result.id, name, description, user_id: userId };
  }

  static async delete(id) {
    // Foreign keys will cascade delete from playlist_tracks, but we can make sure
    await query('DELETE FROM playlist_tracks WHERE playlist_id = ?', [id]);
    return await query('DELETE FROM playlists WHERE id = ?', [id]);
  }

  static async getTracks(playlistId) {
    const sql = `
      SELECT t.*, pt.position 
      FROM tracks t
      JOIN playlist_tracks pt ON t.id = pt.track_id
      WHERE pt.playlist_id = ?
      ORDER BY pt.position ASC, pt.track_id ASC
    `;
    return await query(sql, [playlistId]);
  }

  static async addTrack(playlistId, trackId) {
    // Check if already in playlist
    const existing = await query('SELECT * FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?', [playlistId, trackId]);
    if (existing.length > 0) {
      return { message: 'Track already in playlist' };
    }

    // Get current max position
    const posResult = await query('SELECT MAX(position) as maxPos FROM playlist_tracks WHERE playlist_id = ?', [playlistId]);
    const nextPos = (posResult[0].maxPos || 0) + 1;

    await query('INSERT INTO playlist_tracks (playlist_id, track_id, position) VALUES (?, ?, ?)', [
      playlistId,
      trackId,
      nextPos
    ]);
    return { playlistId, trackId, position: nextPos };
  }

  static async removeTrack(playlistId, trackId) {
    return await query('DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?', [playlistId, trackId]);
  }
}

module.exports = Playlist;
