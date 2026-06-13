require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const session = require('express-session');

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { passport } = require('./controllers/authController');
const initDb = require('./config/initDb');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Ensure upload directories exist ──────────────────────────────
['../uploads/audio', '../uploads/img'].forEach(d => {
  const p = path.join(__dirname, d);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

// ── Middleware ────────────────────────────────────────────────────
app.enable('trust proxy');

app.use((req, res, next) => {
  const originalJson = res.json;
  const originalSend = res.send;

  res.json = function (obj) {
    if (obj && typeof obj === 'object') {
      try {
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const currentBackendUrl = process.env.BACKEND_URL || `${protocol}://${req.get('host')}`;

        const formatTrack = (track) => {
          if (!track || typeof track !== 'object') return;
          if (track.audio_url && typeof track.audio_url === 'string') {
            const url = track.audio_url;
            if (url.includes('youtube.com') || url.includes('youtu.be') || url.startsWith('youtube:')) {
              track.audio_url = `${currentBackendUrl}/api/tracks/${track.id}/stream`;
            }
          }
        };

        if (obj.data) {
          const data = obj.data;
          if (Array.isArray(data)) {
            for (const item of data) {
              formatTrack(item);
              if (item && item.tracks && Array.isArray(item.tracks)) {
                for (const t of item.tracks) formatTrack(t);
              }
            }
          } else if (typeof data === 'object') {
            formatTrack(data);
            if (data.tracks && Array.isArray(data.tracks)) {
              for (const t of data.tracks) formatTrack(t);
            }
          }
        }
      } catch (err) {
        console.error('JSON rewrite error:', err);
      }
    }
    return originalJson.call(this, obj);
  };

  res.send = function (body) {
    if (typeof body === 'string') {
      const contentType = res.get('Content-Type');
      if (contentType && contentType.includes('application/json')) {
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const currentBackendUrl = process.env.BACKEND_URL || `${protocol}://${req.get('host')}`;
        body = body.replace(/https?:\/\/localhost:(?:1005|5000)/g, currentBackendUrl);
      }
    }
    return originalSend.call(this, body);
  };

  next();
});

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
  ],
  credentials: true,
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // limit each IP to 150 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.JWT_SECRET || 'session_secret',
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

// ── Static Files ──────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Database Init ─────────────────────────────────────────────────
initDb().catch(err => console.error('Database init failed:', err));

// ── Routes ────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tracks', require('./routes/trackRoutes'));
app.use('/api/playlists', require('./routes/playlistRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/artists', require('./routes/artistRoutes'));
app.use('/api/albums', require('./routes/albumRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api', require('./routes/interactionRoutes'));

// Admin stats
const { requireAuth, requireAdmin } = require('./middleware/auth');
const { getStats, getPlayHistoryStats, getCategoryTracksStats } = require('./controllers/statsController');
app.get('/api/stats', requireAuth, requireAdmin, getStats);
app.get('/api/stats/history', requireAuth, requireAdmin, getPlayHistoryStats);
app.get('/api/stats/category-tracks', requireAuth, requireAdmin, getCategoryTracksStats);

// Health check
app.get('/api/health', (req, res) =>
  res.json({ status: 'OK', dbType: process.env.DB_TYPE || 'sqlite' }));

// ── Start ─────────────────────────────────────────────────────────
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
// Trigger reload to load updated .env variables for Google and Facebook Strategy - MySQL enabled
