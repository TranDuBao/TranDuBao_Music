const Album = require('../models/Album');
const { deleteFromCloudinary } = require('../config/cloudinary');

exports.getAlbums = async (req, res) => {
  try {
    const data = await Album.getAll();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAlbumById = async (req, res) => {
  try {
    const data = await Album.getById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Album not found' });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createAlbum = async (req, res) => {
  try {
    let { name, artist, cover_url, description, trackIds } = req.body;
    if (!name || !artist) {
      return res.status(400).json({ success: false, message: 'Name and Artist are required' });
    }
    if (typeof trackIds === 'string') {
      try {
        trackIds = JSON.parse(trackIds);
      } catch (e) {
        trackIds = [];
      }
    }
    const data = await Album.create({ name, artist, cover_url, description, trackIds });
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateAlbum = async (req, res) => {
  try {
    let { name, artist, cover_url, description, trackIds } = req.body;
    if (!name || !artist) {
      return res.status(400).json({ success: false, message: 'Name and Artist are required' });
    }

    const oldAlbum = await Album.getById(req.params.id);
    if (oldAlbum && cover_url && oldAlbum.cover_url !== cover_url) {
      await deleteFromCloudinary(oldAlbum.cover_url);
    }

    if (typeof trackIds === 'string') {
      try {
        trackIds = JSON.parse(trackIds);
      } catch (e) {
        trackIds = [];
      }
    }
    const data = await Album.update(req.params.id, { name, artist, cover_url, description, trackIds });
    if (!data) return res.status(404).json({ success: false, message: 'Album not found' });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteAlbum = async (req, res) => {
  try {
    const album = await Album.getById(req.params.id);
    if (album && album.cover_url) {
      await deleteFromCloudinary(album.cover_url);
    }
    await Album.delete(req.params.id);
    res.json({ success: true, message: 'Album deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
