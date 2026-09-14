const { query, dbType } = require('../config/db');

class Notification {
  static async cleanExpiredNotifications() {
    try {
      if (dbType === 'mysql') {
        await query('DELETE FROM notifications WHERE created_at < NOW() - INTERVAL 14 DAY');
      } else {
        await query("DELETE FROM notifications WHERE created_at < datetime('now', '-14 days')");
      }
    } catch (err) {
      console.warn('Failed to clean expired notifications:', err.message);
    }
  }

  static async create({ user_id, title, message, type = 'info', track_id = null }) {
    if (!user_id) return null;
    const result = await query(
      'INSERT INTO notifications (user_id, title, message, type, track_id) VALUES (?, ?, ?, ?, ?)',
      [user_id, title, message, type, track_id]
    );
    return { id: result.insertId, user_id, title, message, type, track_id, is_read: 0 };
  }

  static async getByUserId(userId) {
    // Purge expired notifications first (> 14 days)
    await Notification.cleanExpiredNotifications();

    const rows = await query(
      'SELECT id, user_id, title, message, type, track_id, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    const unreadCount = rows.filter(n => !n.is_read).length;
    return { notifications: rows, unreadCount };
  }

  static async markAsRead(id, userId) {
    await query(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return true;
  }

  static async markAllAsRead(userId) {
    await query(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
      [userId]
    );
    return true;
  }
}

module.exports = Notification;
