const Favorite = require('../models/Favorite');

const getFavorites = async (req, res) => {
  try { res.json({ success: true, data: await Favorite.getUserFavorites(req.user.id) }); }
  catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
const toggle = async (req, res) => {
  try {
    const result = await Favorite.toggle(req.user.id, req.params.trackId);
    res.json({ success: true, ...result });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
const check = async (req, res) => {
  try {
    const favorited = await Favorite.isFavorite(req.user.id, req.params.trackId);
    res.json({ success: true, favorited });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
module.exports = { getFavorites, toggle, check };
