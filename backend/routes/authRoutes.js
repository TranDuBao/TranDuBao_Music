const express    = require('express');
const rateLimit  = require('express-rate-limit');
const router     = express.Router();
const {
  passport, register, login, getMe,
  oauthCallback, getAllUsers, updateUserRole, deleteUser, banUser, adminResetPassword,
  updateProfile, changePassword, updateAvatar, deleteAvatar, getMyUploads
} = require('../controllers/authController');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// ── Strict rate limit for auth endpoints (anti-brute-force) ───────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 20,                     // max 20 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau 15 phút.' },
  skipSuccessfulRequests: true, // don't count successful logins
});

// ── Local Auth ──────────────────────────────────────────────
router.post('/register', authLimiter, register);
router.post('/login',    authLimiter, login);
router.get('/me',        requireAuth, getMe);

// ── Google OAuth ──────────────────────────────────────────────────
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_failed`, session: false }),
  oauthCallback
);

// ── Facebook OAuth ────────────────────────────────────────────────
router.get('/facebook',
  passport.authenticate('facebook', { scope: ['email'], session: false })
);
router.get('/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: `${process.env.FRONTEND_URL}/login?error=facebook_failed`, session: false }),
  oauthCallback
);

// ── Profile ───────────────────────────────────────────────────────
router.put('/profile',           requireAuth, updateProfile);
router.put('/password',          requireAuth, changePassword);
router.put('/avatar',            requireAuth, upload.single('avatar'), updateAvatar);
router.delete('/avatar',         requireAuth, deleteAvatar);
router.get('/my-uploads',        requireAuth, getMyUploads);

// ── Admin: User Management ────────────────────────────────────────
router.get('/users',             requireAuth, requireAdmin, getAllUsers);
router.put('/users/:id/role',    requireAuth, requireAdmin, updateUserRole);
router.put('/users/:id/ban',     requireAuth, requireAdmin, banUser);
router.put('/users/:id/reset-password', requireAuth, requireAdmin, adminResetPassword);
router.delete('/users/:id',      requireAuth, requireAdmin, deleteUser);

module.exports = router;


