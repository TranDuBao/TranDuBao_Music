const express = require('express');
const router  = express.Router();
const albumController = require('../controllers/albumController');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

const { uploadToCloudinary } = require('../config/cloudinary');

// Public endpoints
router.get('/', albumController.getAlbums);
router.get('/:id', albumController.getAlbumById);

// Admin-only endpoints
router.post(
  '/',
  requireAuth,
  requireAdmin,
  upload.single('cover'),
  async (req, res, next) => {
    try {
      if (req.file) {
        req.body.cover_url = await uploadToCloudinary(req.file.path, 'music-stream/albums');
      }
      next();
    } catch (err) {
      next(err);
    }
  },
  albumController.createAlbum
);

router.put(
  '/:id',
  requireAuth,
  requireAdmin,
  upload.single('cover'),
  async (req, res, next) => {
    try {
      if (req.file) {
        req.body.cover_url = await uploadToCloudinary(req.file.path, 'music-stream/albums');
      }
      next();
    } catch (err) {
      next(err);
    }
  },
  albumController.updateAlbum
);

router.delete('/:id', requireAuth, requireAdmin, albumController.deleteAlbum);

module.exports = router;
