const express = require('express');
const router  = express.Router();
const albumController = require('../controllers/albumController');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public endpoints
router.get('/', albumController.getAlbums);
router.get('/:id', albumController.getAlbumById);

// Admin-only endpoints
router.post(
  '/',
  requireAuth,
  requireAdmin,
  upload.single('cover'),
  (req, res, next) => {
    // If a file is uploaded, set cover_url to its server path
    if (req.file) {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:1005';
      req.body.cover_url = `${backendUrl}/uploads/img/${req.file.filename}`;
    }
    next();
  },
  albumController.createAlbum
);

router.put(
  '/:id',
  requireAuth,
  requireAdmin,
  upload.single('cover'),
  (req, res, next) => {
    // If a file is uploaded, set cover_url to its server path
    if (req.file) {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:1005';
      req.body.cover_url = `${backendUrl}/uploads/img/${req.file.filename}`;
    }
    next();
  },
  albumController.updateAlbum
);

router.delete('/:id', requireAuth, requireAdmin, albumController.deleteAlbum);

module.exports = router;
