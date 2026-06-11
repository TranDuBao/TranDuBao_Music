const { query } = require('../config/db');

class User {
  static async findById(id) {
    const rows = await query(
      'SELECT id, name, email, role, provider, avatar_url, bio, created_at, banned_until FROM users WHERE id = ?',
      [id]
    );
    if (!rows[0]) return null;
    const user = rows[0];
    if (user.avatar_url && user.avatar_url.startsWith('/uploads')) {
      user.avatar_url = `http://localhost:5000${user.avatar_url}`;
    }
    return user;
  }

  static async findByEmail(email) {
    const rows = await query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  }

  static async findByProviderId(provider, providerId) {
    const rows = await query(
      'SELECT * FROM users WHERE provider = ? AND provider_id = ?',
      [provider, String(providerId)]
    );
    return rows[0] || null;
  }

  static async create({ name, email, passwordHash = null, role = 'user', provider = 'local', providerId = null, avatarUrl = null }) {
    const result = await query(
      'INSERT INTO users (name, email, password_hash, role, provider, provider_id, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, passwordHash, role, provider, providerId, avatarUrl]
    );
    let finalAvatar = avatarUrl;
    if (finalAvatar && finalAvatar.startsWith('/uploads')) {
      finalAvatar = `http://localhost:5000${finalAvatar}`;
    }
    return { id: result.insertId, name, email, role, provider, avatarUrl: finalAvatar };
  }

  static async getAll() {
    const rows = await query(
      'SELECT id, name, email, role, provider, avatar_url, bio, created_at, banned_until FROM users ORDER BY created_at DESC'
    );
    return rows.map(u => {
      if (u.avatar_url && u.avatar_url.startsWith('/uploads')) {
        u.avatar_url = `http://localhost:5000${u.avatar_url}`;
      }
      return u;
    });
  }

  static async ban(id, bannedUntil) {
    // bannedUntil: ISO datetime string or null to unban
    await query('UPDATE users SET banned_until = ? WHERE id = ?', [bannedUntil, id]);
    return await User.findById(id);
  }

  static async delete(id) {
    return await query('DELETE FROM users WHERE id = ?', [id]);
  }

  static async updateRole(id, role) {
    await query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    return await User.findById(id);
  }
}

module.exports = User;
