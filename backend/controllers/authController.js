const bcrypt = require('bcryptjs');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

// ── Passport Google Strategy ─────────────────────────────────────
const setupGoogleStrategy = () => {
  if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === 'your_google_client_id_here') {
    console.warn('⚠  Google OAuth not configured. Set GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET in .env');
    return;
  }

  passport.use(new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  `${process.env.BACKEND_URL}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findByProviderId('google', profile.id);
        if (!user) {
          user = await User.create({
            name:       profile.displayName,
            email:      profile.emails?.[0]?.value || null,
            provider:   'google',
            providerId: profile.id,
            avatarUrl:  profile.photos?.[0]?.value || null,
          });
        }
        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  ));
};

// ── Passport Facebook Strategy ───────────────────────────────────
const setupFacebookStrategy = () => {
  if (!process.env.FACEBOOK_APP_ID || process.env.FACEBOOK_APP_ID === 'your_facebook_app_id_here') {
    console.warn('⚠  Facebook OAuth not configured. Set FACEBOOK_APP_ID & FACEBOOK_APP_SECRET in .env');
    return;
  }

  passport.use(new FacebookStrategy(
    {
      clientID:     process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL:  `${process.env.BACKEND_URL}/api/auth/facebook/callback`,
      profileFields: ['id', 'displayName', 'email', 'picture.type(large)'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findByProviderId('facebook', profile.id);
        if (!user) {
          user = await User.create({
            name:       profile.displayName,
            email:      profile.emails?.[0]?.value || null,
            provider:   'facebook',
            providerId: profile.id,
            avatarUrl:  profile.photos?.[0]?.value || null,
          });
        }
        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  ));
};

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try { done(null, await User.findById(id)); }
  catch (err) { done(err, null); }
});

setupGoogleStrategy();
setupFacebookStrategy();

// ─────────────────────────────────────────────────────────────────
// Controller methods
// ─────────────────────────────────────────────────────────────────

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });

    const existing = await User.findByEmail(email);
    if (existing)
      return res.status(409).json({ success: false, message: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });
    const token = generateToken(user);

    res.status(201).json({ success: true, token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required' });

    const user = await User.findByEmail(email);
    if (!user || user.provider !== 'local')
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const token = generateToken(user);
    res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar_url: user.avatar_url }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// OAuth callback — redirect to frontend with token
const oauthCallback = (req, res) => {
  const token = generateToken(req.user);
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
};

// Admin: get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.getAll();
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin: update user role
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'user'].includes(role))
      return res.status(400).json({ success: false, message: 'Role must be admin or user' });
    const user = await User.updateRole(req.params.id, role);
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin: delete user
const deleteUser = async (req, res) => {
  try {
    if (String(req.params.id) === String(req.user.id))
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    await User.delete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin: ban / unban user
const banUser = async (req, res) => {
  try {
    const targetId = req.params.id;
    if (String(targetId) === String(req.user.id))
      return res.status(400).json({ success: false, message: 'Không thể khóa chính tài khoản của bạn' });

    const { type, days } = req.body; // type: 'permanent' | 'days' | 'unban'
    let bannedUntil = null;

    if (type === 'permanent') {
      bannedUntil = '9999-12-31 23:59:59';
    } else if (type === 'days' && days > 0) {
      // Calculate ban end time in Vietnam time (UTC+7)
      const until = new Date();
      until.setDate(until.getDate() + Number(days));
      // Format as ISO string (stored naive - no TZ suffix so SQLite treats as local-ish)
      const pad = (n) => String(n).padStart(2, '0');
      bannedUntil = `${until.getFullYear()}-${pad(until.getMonth()+1)}-${pad(until.getDate())} ${pad(until.getHours())}:${pad(until.getMinutes())}:${pad(until.getSeconds())}`;
    } else if (type === 'unban') {
      bannedUntil = null;
    } else {
      return res.status(400).json({ success: false, message: 'Tham số không hợp lệ' });
    }

    const user = await User.ban(targetId, bannedUntil);
    res.json({ success: true, data: user, message: type === 'unban' ? 'Mở khóa thành công' : 'Khóa tài khoản thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// User: update profile info
const updateProfile = async (req, res) => {
  try {
    const { name, bio } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name required' });
    await require('../config/db').query(
      'UPDATE users SET name=?, bio=? WHERE id=?', [name.trim(), bio || '', req.user.id]);
    const user = await User.findById(req.user.id);
    res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar_url: user.avatar_url, bio: user.bio } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// User: change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ success: false, message: 'Both passwords required' });
    if (newPassword.length < 6)
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });

    const user = await User.findById(req.user.id);
    if (!user.password_hash)
      return res.status(400).json({ success: false, message: 'OAuth accounts cannot change password' });

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return res.status(401).json({ success: false, message: 'Current password is incorrect' });

    const newHash = await bcrypt.hash(newPassword, 10);
    await require('../config/db').query('UPDATE users SET password_hash=? WHERE id=?', [newHash, req.user.id]);
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// User: update avatar via file upload
const updateAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const avatarUrl = `/uploads/img/${req.file.filename}`;
    await require('../config/db').query('UPDATE users SET avatar_url=? WHERE id=?', [avatarUrl, req.user.id]);
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:1005';
    res.json({ success: true, avatar_url: `${backendUrl}${avatarUrl}` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// User: get uploads (tracks uploaded by current user)
const getMyUploads = async (req, res) => {
  try {
    const tracks = await require('../config/db').query(
      'SELECT * FROM tracks WHERE user_id=? ORDER BY created_at DESC', [req.user.id]);
    res.json({ success: true, data: tracks });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

module.exports = {
  passport, register, login, getMe, oauthCallback,
  getAllUsers, updateUserRole, deleteUser, banUser,
  updateProfile, changePassword, updateAvatar, getMyUploads
};

