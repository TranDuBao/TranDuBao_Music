const Rating = require('../models/Rating');
const PlayHistory = require('../models/PlayHistory');

const rateTrack = async (req, res) => {
  try {
    const { rating } = req.body;
    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ success: false, message: 'Rating must be 1-5' });
    const result = await Rating.rate(req.user.id, req.params.trackId, rating);
    const userRating = await Rating.getUserRating(req.user.id, req.params.trackId);
    res.json({ success: true, data: { ...result, userRating } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
const getTrackRating = async (req, res) => {
  try {
    const data = await Rating.getTrackRating(req.params.trackId);
    const userRating = req.user ? await Rating.getUserRating(req.user.id, req.params.trackId) : 0;
    res.json({ success: true, data: { ...data, userRating } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
const recordPlay = async (req, res) => {
  try {
    if (req.user) await PlayHistory.record(req.user.id, req.params.trackId);
    else await require('../config/db').query('UPDATE tracks SET play_count=play_count+1 WHERE id=?', [req.params.trackId]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
const getUserHistory = async (req, res) => {
  try { res.json({ success: true, data: await PlayHistory.getUser(req.user.id) }); }
  catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
module.exports = { rateTrack, getTrackRating, recordPlay, getUserHistory };
