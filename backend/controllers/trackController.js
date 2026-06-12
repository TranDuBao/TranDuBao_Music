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
    execFile(ytDlpPath, args, { timeout: 30000, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
      } else {
        resolve(stdout);
      }
    });
  });
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

const importTrack = async (req, res) => {
  try {
    const { url, genre = 'Lofi', is_public = 1, category_id = null } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, message: 'URL is required' });
    }

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:1005';
    const audioDir  = path.resolve(__dirname, '../../uploads/audio');
    const imgDir    = path.resolve(__dirname, '../../uploads/img');

    // Create directories if they do not exist
    if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });
    if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });

    // Try yt-dlp first
    try {
      console.log(`[Import] Fetching metadata for URL: ${url}`);
      const metaJson = await runYtDlp(['--js-runtimes', 'node', '--no-warnings', '--no-playlist', '--dump-json', url]);
      const meta = JSON.parse(metaJson);

      const title = meta.title || 'Imported Audio';
      const artist = meta.uploader || meta.artist || meta.channel || 'Unknown Artist';
      const duration = parseInt(meta.duration) || 180;
      
      const outputFilenameBase = `${Date.now()}_ytdl`;
      const outputPathPattern = path.join(audioDir, `${outputFilenameBase}.%(ext)s`);
      
      console.log(`[Import] Downloading audio via yt-dlp...`);
      await runYtDlp(['-f', 'bestaudio', '--js-runtimes', 'node', '--no-warnings', '--no-playlist', '-o', outputPathPattern, url]);
      
      // Find the exact filename that yt-dlp wrote
      const files = fs.readdirSync(audioDir);
      const downloadedFile = files.find(f => f.startsWith(outputFilenameBase));
      if (!downloadedFile) {
        throw new Error('Downloaded audio file not found');
      }

      // Handle Cover image from thumbnail
      let cover_url = '';
      const thumbnailUrl = meta.thumbnail;
      if (thumbnailUrl) {
        const coverFilename = `${Date.now()}_ytdl.jpg`;
        const coverLocalPath = path.join(imgDir, coverFilename);
        try {
          await downloadFile(thumbnailUrl, coverLocalPath);
          cover_url = `${backendUrl}/uploads/img/${coverFilename}`;
        } catch (err) {
          console.error('[Import] Failed to download thumbnail:', err.message);
        }
      }

      const audio_url = `${backendUrl}/uploads/audio/${downloadedFile}`;

      const newTrack = await Track.create({
        title,
        artist,
        album: meta.extractor_key || 'Imported',
        duration,
        cover_url,
        audio_url,
        genre,
        is_public: Number(is_public),
        user_id: req.user?.id || null,
        category_id: category_id ? Number(category_id) : null
      });

      return res.status(201).json({ success: true, data: newTrack });
    } catch (ytDlpError) {
      console.warn('[Import] yt-dlp failed, falling back to direct URL download:', ytDlpError.message);
      
      // Direct file import fallback
      if (url.match(/\.(mp3|wav|m4a|ogg|flac|aac)(\?.*)?$/i)) {
        const audioFilename = `${Date.now()}_direct.mp3`;
        const audioLocalPath = path.join(audioDir, audioFilename);
        
        await downloadFile(url, audioLocalPath);
        
        const audio_url = `${backendUrl}/uploads/audio/${audioFilename}`;
        const newTrack = await Track.create({
          title: 'Imported Song',
          artist: 'Unknown Artist',
          album: 'Web Import',
          duration: 180,
          cover_url: '',
          audio_url,
          genre,
          is_public: Number(is_public),
          user_id: req.user?.id || null,
          category_id: category_id ? Number(category_id) : null
        });
        
        return res.status(201).json({ success: true, data: newTrack });
      } else {
        return res.status(400).json({ 
          success: false, 
          message: `Không thể tải nhạc từ liên kết này. Lỗi: ${ytDlpError.message}` 
        });
      }
    }
  } catch (err) {
    console.error('Import Error:', err);
    res.status(500).json({ success: false, message: err.message });
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
