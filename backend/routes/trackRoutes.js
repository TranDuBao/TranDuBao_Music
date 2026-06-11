const express = require('express');
const router  = express.Router();
const trackController = require('../controllers/trackController');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public — optionalAuth injects user if token present
router.get('/top-weekly', trackController.getTopWeekly);
router.get('/',    optionalAuth, trackController.getAllTracks);
router.get('/:id', optionalAuth, trackController.getTrackById);

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
