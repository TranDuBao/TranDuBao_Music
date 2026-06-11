const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

/**
 * Generate a signed JWT for a given user object.
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const updateActivity = (user) => {
  if (!user) return;
  const now = new Date();
  const lastActive = user.last_active_at ? new Date(user.last_active_at) : null;
  if (lastActive && (now - lastActive) < 60 * 1000) {
    return;
  }
  const { query, dbType } = require('../config/db');
  const timeExpr = dbType === 'mysql' ? 'NOW()' : 'CURRENT_TIMESTAMP';
  query(`UPDATE users SET last_active_at = ${timeExpr} WHERE id = ?`, [user.id])
    .then(() => {
      user.last_active_at = now;
    })
    .catch(err => console.error('Failed to update last_active_at:', err.message));
};

/**
 * Middleware: Require a valid JWT in Authorization header.
 */
const requireAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized: User not found' });
    }

    // ── Ban check ──────────────────────────────────────────────────
    if (user.banned_until) {
      const bannedUntilDate = new Date(user.banned_until);
      const now = new Date();
      if (bannedUntilDate > now) {
        const isPermanent = bannedUntilDate.getFullYear() >= 9999;
        const msg = isPermanent
          ? 'Tài khoản của bạn đã bị khóa vĩnh viễn.'
          : `Tài khoản bị khóa đến ${bannedUntilDate.toLocaleString('vi-VN')}.`;
        return res.status(403).json({ success: false, message: msg, banned: true });
      }
    }

    req.user = user;
    updateActivity(user);
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Invalid or expired token' });
  }
};

/**
 * Middleware: Require admin role.
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden: Admin access required' });
  }
  next();
};

/**
 * Optional auth: Attach user to req if token present, but don't block.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) {
      const token = header.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = await User.findById(decoded.id);
      if (req.user) {
        updateActivity(req.user);
      }
    }
  } catch {
    // No token or invalid — that's OK for optional auth
  }
  next();
};

module.exports = { requireAuth, requireAdmin, optionalAuth, generateToken };
