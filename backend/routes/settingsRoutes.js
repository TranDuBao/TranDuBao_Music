const express = require('express');
const router  = express.Router();
const settingsController = require('../controllers/settingsController');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public endpoints
router.get('/banner-slides', settingsController.getBannerSlides);
router.get('/background', settingsController.getBackground);

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

module.exports = router;
