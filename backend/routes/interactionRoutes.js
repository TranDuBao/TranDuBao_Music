const router = require('express').Router();
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { rateTrack, getTrackRating, recordPlay, getUserHistory } = require('../controllers/ratingController');
const { getFavorites, toggle, check } = require('../controllers/favoriteController');

// Play recording
router.post('/tracks/:trackId/play',   optionalAuth, recordPlay);
// Ratings
router.get('/tracks/:trackId/rating',  optionalAuth, getTrackRating);
router.post('/tracks/:trackId/rate',   requireAuth,  rateTrack);
// Favorites
router.get('/favorites',               requireAuth,  getFavorites);
router.post('/favorites/:trackId',     requireAuth,  toggle);
router.get('/favorites/:trackId/check',requireAuth,  check);
// History
router.get('/history',                 requireAuth,  getUserHistory);
module.exports = router;
