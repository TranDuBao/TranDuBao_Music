const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const Track = require('../models/Track');
const { query, dbType } = require('../config/db');

const isWindows = process.platform === 'win32';
const ytDlpPath = isWindows
  ? path.resolve(__dirname, '../bin/yt-dlp.exe')
  : path.resolve(__dirname, '../bin/yt-dlp');

// Ensure executable permissions on Linux/macOS
if (!isWindows) {
  try {
    if (fs.existsSync(ytDlpPath)) {
      fs.chmodSync(ytDlpPath, '755');
    }
  } catch (err) {
    console.error('Failed to set executable permission on yt-dlp binary:', err.message);
  }
}

const runYtDlp = (args) => {
  return new Promise((resolve, reject) => {
    execFile(ytDlpPath, args, { timeout: 90000, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
      } else {
        resolve(stdout);
      }
    });
  });
};

// Helper: detect YouTube bot/login block errors regardless of apostrophe encoding
const isBotBlocked = (msg) => {
  if (!msg) return false;
  const lower = msg.toLowerCase();
  return (
    lower.includes('not a bot') ||
    lower.includes('sign in to confirm') ||
    lower.includes('cookies-from-browser') ||
    lower.includes('use --cookies') ||
    lower.includes('bot detection') ||
    lower.includes('verify you') ||
    lower.includes('confirm your') ||
    lower.includes('too many requests') ||
    lower.includes('http error 429') ||
    lower.includes('preconditionrequired') ||
    lower.includes('this video is unavailable') ||
    lower.includes('video unavailable')
  );
};

// Helper to download files (like covers or direct links)
const downloadFile = async (url, destPath) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await fs.promises.writeFile(destPath, buffer);
};

const getAllTracks = async (req, res) => {
  try {
    const search     = req.query.search || '';
    const showMine   = req.query.mine === 'true';
    const userId     = req.user?.id || null;
    const categoryId = req.query.categoryId || null;
    const tracks     = await Track.getAll(search, userId, showMine, categoryId);
    res.json({ success: true, data: tracks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getTrackById = async (req, res) => {
  try {
    const track = await Track.getById(req.params.id);
    if (!track) return res.status(404).json({ success: false, message: 'Track not found' });
    res.json({ success: true, data: track });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createTrack = async (req, res) => {
  try {
    const { title, artist } = req.body;
    if (!title || !artist)
      return res.status(400).json({ success: false, message: 'Title and artist are required' });

    // Check duplicate track: title and artist (case-insensitive)
    const existing = await query('SELECT id FROM tracks WHERE LOWER(title) = LOWER(?) AND LOWER(artist) = LOWER(?)', [title.trim(), artist.trim()]);
    if (existing && existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Bài hát đã có sẵn' });
    }

    let audio_url = req.body.audio_url;
    let cover_url = req.body.cover_url || '';

    // Handle file uploads
    if (req.files?.audio?.[0]) {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:1005';
      audio_url = `${backendUrl}/uploads/audio/${req.files.audio[0].filename}`;
    }
    if (req.files?.cover?.[0]) {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:1005';
      cover_url = `${backendUrl}/uploads/img/${req.files.cover[0].filename}`;
    }

    if (!audio_url)
      return res.status(400).json({ success: false, message: 'Audio file or URL is required' });

    const newTrack = await Track.create({
      ...req.body,
      audio_url,
      cover_url,
      user_id:   req.user?.id || null,
      is_public: req.body.is_public !== undefined ? Number(req.body.is_public) : 1,
    });
    res.status(201).json({ success: true, data: newTrack });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateTrack = async (req, res) => {
  try {
    const track = await Track.getById(req.params.id);
    if (!track) return res.status(404).json({ success: false, message: 'Track not found' });

    // Only owner or admin can update
    if (track.user_id && track.user_id !== req.user?.id && req.user?.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Forbidden' });

    const updated = await Track.update(req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteTrack = async (req, res) => {
  try {
    const track = await Track.getById(req.params.id);
    if (!track) return res.status(404).json({ success: false, message: 'Track not found' });

    // Owner or admin can delete
    if (track.user_id && track.user_id !== req.user?.id && req.user?.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Forbidden' });

    await Track.delete(req.params.id);
    res.json({ success: true, message: 'Track deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Player clients to try in order ────────────────────────────────────────────
// Render datacenter IPs are often blocked by web client but less so by mobile/TV clients.
const PLAYER_CLIENTS = ['android_vr', 'tv_embed', 'ios', 'mweb', 'web_creator'];

const importTrack = async (req, res) => {
  let cookieFilePath = null;
  try {
    const { url, genre = 'Lofi', is_public = 1, category_id = null } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, message: 'URL là bắt buộc' });
    }

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:1005';
    const audioDir   = path.resolve(__dirname, '../../uploads/audio');
    const imgDir     = path.resolve(__dirname, '../../uploads/img');

    if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });
    if (!fs.existsSync(imgDir))   fs.mkdirSync(imgDir,   { recursive: true });

    // ── Load cookies from DB (optional) ───────────────────────────────
    try {
      const rows = await query("SELECT value FROM settings WHERE `key` = 'youtube_cookies'");
      if (rows && rows.length > 0 && rows[0].value && rows[0].value.trim()) {
        const tempDir = path.resolve(__dirname, '../../temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
        cookieFilePath = path.join(tempDir, `yt_cookies_${Date.now()}.txt`);
        fs.writeFileSync(cookieFilePath, rows[0].value.trim(), 'utf8');
        console.log('[Import] YouTube cookies loaded from DB.');
      }
    } catch (e) {
      console.warn('[Import] Could not load cookies from DB:', e.message);
    }

    // Shared base flags
    const baseFlags = ['--no-warnings', '--no-playlist', '--geo-bypass'];
    if (cookieFilePath) {
      baseFlags.push('--cookies', cookieFilePath);
    }

    // ── STEP 1: Fetch metadata — try each client ───────────────────────
    let meta         = null;
    let lastMetaErr  = null;

    for (const client of PLAYER_CLIENTS) {
      try {
        console.log(`[Import] Metadata attempt with client="${client}"`);
        const args = [
          ...baseFlags,
          '--extractor-args', `youtube:player_client=${client}`,
          '--dump-json',
          url,
        ];
        const raw = await runYtDlp(args);
        meta = JSON.parse(raw);
        console.log(`[Import] Metadata OK  (client="${client}", title="${meta.title}")`);
        break;
      } catch (err) {
        lastMetaErr = err;
        console.warn(`[Import] Metadata FAIL (client="${client}"): ${(err.message || '').slice(0, 150)}`);
      }
    }

    if (!meta) {
      const raw = lastMetaErr?.message || '';
      console.error('[Import] All clients failed for metadata.');
      const msg = isBotBlocked(raw)
        ? 'YouTube đang chặn server của ứng dụng. Hãy nhờ admin dán YouTube Cookies vào phần "Admin Panel → Cấu hình → YouTube Cookies" để tiếp tục.'
        : `Không thể lấy thông tin bài hát từ URL này. Lỗi: ${raw.slice(0, 300)}`;
      return res.status(400).json({ success: false, message: msg });
    }

    const title  = meta.title                                             || 'Imported Audio';
    const artist = meta.uploader || meta.artist || meta.channel           || 'Unknown Artist';

    // ── STEP 2: Duplicate check ────────────────────────────────────────
    const dup = await query(
      'SELECT id FROM tracks WHERE LOWER(title) = LOWER(?) AND LOWER(artist) = LOWER(?)',
      [title.trim(), artist.trim()]
    );
    if (dup && dup.length > 0) {
      return res.status(400).json({ success: false, message: 'Bài hát đã có sẵn trong thư viện.' });
    }

    // ── STEP 3: Download audio — try each client ────────────────────────
    const fileBase   = `${Date.now()}_ytdl`;
    const outPattern = path.join(audioDir, `${fileBase}.%(ext)s`);
    let   audioFile  = null;
    let   lastDlErr  = null;

    for (const client of PLAYER_CLIENTS) {
      try {
        console.log(`[Import] Download attempt with client="${client}"`);
        const args = [
          ...baseFlags,
          '-f', 'bestaudio/best',
          '--extractor-args', `youtube:player_client=${client}`,
          '-o', outPattern,
          url,
        ];
        await runYtDlp(args);
        const found = fs.readdirSync(audioDir).find(f => f.startsWith(fileBase));
        if (found) {
          audioFile = found;
          console.log(`[Import] Download OK   (client="${client}", file="${found}")`);
          break;
        }
      } catch (err) {
        lastDlErr = err;
        console.warn(`[Import] Download FAIL (client="${client}"): ${(err.message || '').slice(0, 150)}`);
      }
    }

    if (!audioFile) {
      const raw = lastDlErr?.message || '';
      console.error('[Import] All clients failed for audio download.');
      const msg = isBotBlocked(raw)
        ? 'YouTube đang chặn server của ứng dụng. Hãy nhờ admin dán YouTube Cookies vào phần "Admin Panel → Cấu hình → YouTube Cookies" để tiếp tục.'
        : `Không thể tải âm thanh. Lỗi: ${raw.slice(0, 300)}`;
      return res.status(400).json({ success: false, message: msg });
    }

    // ── STEP 4: Download thumbnail ─────────────────────────────────────
    let cover_url = '';
    try {
      if (meta.thumbnail) {
        const thumbFile = `${Date.now()}_ytdl.jpg`;
        const thumbPath = path.join(imgDir, thumbFile);
        await downloadFile(meta.thumbnail, thumbPath);
        cover_url = `${backendUrl}/uploads/img/${thumbFile}`;
      }
    } catch (e) {
      console.warn('[Import] Thumbnail download skipped:', e.message);
    }

    // ── STEP 5: Persist track ──────────────────────────────────────────
    const audio_url = `${backendUrl}/uploads/audio/${audioFile}`;
    const newTrack  = await Track.create({
      title,
      artist,
      album:       meta.extractor_key || 'Imported',
      duration:    parseInt(meta.duration) || 180,
      cover_url,
      audio_url,
      genre,
      is_public:   Number(is_public),
      user_id:     req.user?.id || null,
      category_id: category_id ? Number(category_id) : null,
    });

    return res.status(201).json({ success: true, data: newTrack });

  } catch (err) {
    const raw = err.message || '';
    console.error('[Import] Unhandled error:', raw);
    const msg = isBotBlocked(raw)
      ? 'YouTube đang chặn server của ứng dụng. Hãy nhờ admin dán YouTube Cookies vào phần "Admin Panel → Cấu hình → YouTube Cookies" để tiếp tục.'
      : raw;
    res.status(500).json({ success: false, message: msg });
  } finally {
    if (cookieFilePath) {
      try { fs.unlinkSync(cookieFilePath); } catch (_) {}
    }
  }
};

const getTopWeekly = async (req, res) => {
  try {
    // played_at is stored as Vietnam time (UTC+7), compare against 7 days ago in VN time
    const timeExpr = dbType === 'mysql'
      ? 'DATE_SUB(DATE_ADD(UTC_TIMESTAMP(), INTERVAL 7 HOUR), INTERVAL 7 DAY)'
      : "datetime('now', '+7 hours', '-7 days')";

    const topTracks = await query(`
      SELECT t.id, t.title, t.artist, t.cover_url, t.audio_url, t.genre, t.duration,
             COUNT(ph.id) as weekly_plays
      FROM tracks t
      JOIN play_history ph ON ph.track_id = t.id
      WHERE ph.played_at >= ${timeExpr}
      GROUP BY t.id
      ORDER BY weekly_plays DESC
      LIMIT 5
    `);
    res.json({ success: true, data: topTracks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getRecentUploads = async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const tracks = await Track.getRecentUploads(userId);
    res.json({ success: true, data: tracks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAllTracks, getTrackById, createTrack, updateTrack, deleteTrack, importTrack, getTopWeekly, getRecentUploads };
