const { query } = require('../config/db');

class Category {
  static async getAll() {
    return await query(`
      SELECT c.*, COUNT(t.id) as track_count
      FROM categories c LEFT JOIN tracks t ON t.category_id = c.id
      GROUP BY c.id ORDER BY c.name`);
  }
  static async getById(id) {
    const rows = await query('SELECT * FROM categories WHERE id=?', [id]);
    return rows[0] || null;
  }
  static async create({ name, description, color = '#7c3aed', icon = '🎵' }) {
    const r = await query('INSERT INTO categories (name,description,color,icon) VALUES (?,?,?,?)',
      [name, description, color, icon]);
    return await Category.getById(r.insertId);
  }
  static async update(id, { name, description, color, icon }) {
    await query('UPDATE categories SET name=?,description=?,color=?,icon=? WHERE id=?',
      [name, description, color, icon, id]);
    return await Category.getById(id);
  }
  static async delete(id) {
    await query('UPDATE tracks SET category_id=NULL WHERE category_id=?', [id]);
    return await query('DELETE FROM categories WHERE id=?', [id]);
  }
}
module.exports = Category;
