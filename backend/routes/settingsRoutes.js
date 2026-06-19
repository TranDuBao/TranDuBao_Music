const express = require('express');
const router  = express.Router();
const settingsController = require('../controllers/settingsController');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public endpoints
router.get('/banner-slides', settingsController.getBannerSlides);
router.get('/background', settingsController.getBackground);
router.get('/backdrops', settingsController.getBackdrops);

// Admin-only endpoints
router.post(
  '/banner-slides',
  requireAuth,
  requireAdmin,
  upload.single('cover'),
  settingsController.createBannerSlide
);

router.delete(
  '/banner-slides/:id',
  requireAuth,
  requireAdmin,
  settingsController.deleteBannerSlide
);

router.post(
  '/background',
  requireAuth,
  requireAdmin,
  upload.single('cover'),
  settingsController.updateBackground
);

router.post(
  '/backdrops',
  requireAuth,
  requireAdmin,
  upload.single('cover'),
  settingsController.createBackdrop
);

router.delete(
  '/backdrops/:id',
  requireAuth,
  requireAdmin,
  settingsController.deleteBackdrop
);

router.get(
  '/youtube-cookies',
  requireAuth,
  requireAdmin,
  settingsController.getYoutubeCookies
);

router.post(
  '/youtube-cookies',
  requireAuth,
  requireAdmin,
  settingsController.updateYoutubeCookies
);

module.exports = router;
