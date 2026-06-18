const express = require('express');
const router  = express.Router();
const trackController = require('../controllers/trackController');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

// ── Music search proxy (Deezer) — no API key needed ──────────────────────────
router.get('/search', async (req, res) => {
  try {
    const q = req.query.q || '';
    if (!q.trim()) return res.json({ success: true, data: [] });
    const url = `https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=20&output=json`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Deezer API error: ' + response.status);
    const json = await response.json();
    const tracks = (json.data || []).map(t => ({
      title: t.title,
      artist: t.artist?.name || 'Unknown',
      album: t.album?.title || '',
      duration: t.duration || 180,
      cover_url: t.album?.cover_medium || t.album?.cover || '',
      // Use 30-second Deezer preview as audio — always works, no API key needed
      audio_url: t.preview || '',
      deezerId: t.id,
      preview: t.preview || '',
    }));
    res.json({ success: true, data: tracks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── YouTube oEmbed metadata — no yt-dlp, instant ─────────────────────────────
router.get('/youtube-meta', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ success: false, message: 'url required' });
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const response = await fetch(oembedUrl);
    if (!response.ok) throw new Error('oEmbed failed: ' + response.status);
    const data = await response.json();
    res.json({ success: true, data: {
      title: data.title,
      artist: data.author_name || 'Unknown Artist',
      thumbnail: data.thumbnail_url || '',
      duration: 180
    }});
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Public — optionalAuth injects user if token present
router.get('/debug-ytdlp', trackController.debugYtDlp);
router.get('/top-weekly', trackController.getTopWeekly);
router.get('/recent-uploads', optionalAuth, trackController.getRecentUploads);
router.get('/',    optionalAuth, trackController.getAllTracks);
router.get('/:id', optionalAuth, trackController.getTrackById);
router.get('/:id/stream', trackController.streamTrack);

// Protected — must be logged in
router.post('/import', requireAuth, trackController.importTrack);
router.post(
  '/',
  requireAuth,
  upload.fields([{ name: 'audio', maxCount: 1 }, { name: 'cover', maxCount: 1 }]),
  trackController.createTrack
);
router.put('/:id',    requireAuth, trackController.updateTrack);
router.delete('/:id', requireAuth, trackController.deleteTrack);

module.exports = router;
