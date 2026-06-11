const express = require('express');
const router  = express.Router();
const artistController = require('../controllers/artistController');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public endpoint to get all featured artists
router.get('/', artistController.getAllArtists);

// Admin-only endpoints
router.post(
  '/',
  requireAuth,
  requireAdmin,
  upload.single('cover'), // uses the 'cover' field to store inside uploads/img
  artistController.createArtist
);

router.delete('/:id', requireAuth, requireAdmin, artistController.deleteArtist);

module.exports = router;
