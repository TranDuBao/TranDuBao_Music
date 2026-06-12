require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');
const session = require('express-session');

const helmet  = require('helmet');
const rateLimit = require('express-rate-limit');
const { passport } = require('./controllers/authController');
const initDb  = require('./config/initDb');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Ensure upload directories exist ──────────────────────────────
['../uploads/audio','../uploads/img'].forEach(d => {
  const p = path.join(__dirname, d);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

// ── Middleware ────────────────────────────────────────────────────
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
  max: 1000, // limit each IP to 1000 requests per windowMs
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
app.use('/api/auth',        require('./routes/authRoutes'));
app.use('/api/tracks',      require('./routes/trackRoutes'));
app.use('/api/playlists',   require('./routes/playlistRoutes'));
app.use('/api/categories',  require('./routes/categoryRoutes'));
app.use('/api/artists',     require('./routes/artistRoutes'));
app.use('/api/albums',      require('./routes/albumRoutes'));
app.use('/api/settings',    require('./routes/settingsRoutes'));
app.use('/api',             require('./routes/interactionRoutes'));

// Admin stats
const { requireAuth, requireAdmin } = require('./middleware/auth');
const { getStats, getPlayHistoryStats, getCategoryTracksStats } = require('./controllers/statsController');
app.get('/api/stats', requireAuth, requireAdmin, getStats);
app.get('/api/stats/history', requireAuth, requireAdmin, getPlayHistoryStats);
app.get('/api/stats/category-tracks', requireAuth, requireAdmin, getCategoryTracksStats);

// Health check
app.get('/api/health', (req, res) =>
  res.json({ status: 'OK', dbType: process.env.DB_TYPE || 'sqlite', version: 'v4-limit-fix' }));

// ── Start ─────────────────────────────────────────────────────────
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
// Trigger reload to load updated .env variables for Google and Facebook Strategy - MySQL enabled
