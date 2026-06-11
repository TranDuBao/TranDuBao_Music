const { query } = require('../config/db');

class Album {
  static async getAll() {
    const albums = await query('SELECT * FROM albums ORDER BY id DESC');
    for (let album of albums) {
      album.tracks = await query('SELECT * FROM tracks WHERE album_id = ?', [album.id]);
    }
    return albums;
  }

  static async getById(id) {
    const rows = await query('SELECT * FROM albums WHERE id = ?', [id]);
    const album = rows[0] || null;
    if (album) {
      album.tracks = await query('SELECT * FROM tracks WHERE album_id = ?', [album.id]);
    }
    return album;
  }

  static async create({ name, artist, cover_url, description, trackIds = [] }) {
    const sql = `
      INSERT INTO albums (name, artist, cover_url, description)
      VALUES (?, ?, ?, ?)
    `;
    const result = await query(sql, [name, artist, cover_url, description]);
    const albumId = result.insertId;

    if (trackIds.length > 0) {
      // First, set tracks that matched this name/artist text to 'Single' if they had it
      await query(`UPDATE tracks SET album = 'Single', album_id = NULL WHERE album_id = ?`, [albumId]);
      // Then set new tracks to this album name & album_id
      const placeholders = trackIds.map(() => '?').join(',');
      await query(`UPDATE tracks SET album = ?, album_id = ? WHERE id IN (${placeholders})`, [name, albumId, ...trackIds]);
    }

    return await Album.getById(albumId);
  }

  static async update(id, { name, artist, cover_url, description, trackIds = [] }) {
    const existing = await Album.getById(id);
    if (!existing) return null;

    await query(
      'UPDATE albums SET name = ?, artist = ?, cover_url = ?, description = ? WHERE id = ?',
      [name, artist, cover_url, description, id]
    );

    // Update track assignments:
    // First, clear track assignments for this album
    await query(`UPDATE tracks SET album = 'Single', album_id = NULL WHERE album_id = ?`, [id]);
    
    if (trackIds.length > 0) {
      // Then assign the new selected tracks
      const placeholders = trackIds.map(() => '?').join(',');
      await query(`UPDATE tracks SET album = ?, album_id = ? WHERE id IN (${placeholders})`, [name, id, ...trackIds]);
    }

    return await Album.getById(id);
  }

  static async delete(id) {
    // Reset tracks pointing to this album
    await query(`UPDATE tracks SET album = 'Single', album_id = NULL WHERE album_id = ?`, [id]);
    return await query('DELETE FROM albums WHERE id = ?', [id]);
  }
}

module.exports = Album;
