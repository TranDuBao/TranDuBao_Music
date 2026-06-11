const express = require('express');
const router = express.Router();
const playlistController = require('../controllers/playlistController');
const { requireAuth } = require('../middleware/auth');

// Protect all playlist endpoints with authentication
router.use(requireAuth);

router.get('/', playlistController.getAllPlaylists);
router.get('/:id', playlistController.getPlaylistById);
router.post('/', playlistController.createPlaylist);
router.delete('/:id', playlistController.deletePlaylist);

// Playlist tracks endpoints
router.get('/:id/tracks', playlistController.getPlaylistTracks);
router.post('/:id/tracks', playlistController.addTrackToPlaylist);
router.delete('/:id/tracks/:trackId', playlistController.removeTrackFromPlaylist);

module.exports = router;
