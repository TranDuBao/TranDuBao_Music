const Playlist = require('../models/Playlist');

const getAllPlaylists = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const playlists = await Playlist.getByUserId(userId);
    res.json({ success: true, data: playlists });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPlaylistById = async (req, res) => {
  try {
    const userId = req.user?.id;
    const playlist = await Playlist.getById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ success: false, message: 'Playlist not found' });
    }
    if (playlist.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    res.json({ success: true, data: playlist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createPlaylist = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Playlist name is required' });
    }
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const newPlaylist = await Playlist.create({ name, description, userId });
    res.status(201).json({ success: true, data: newPlaylist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deletePlaylist = async (req, res) => {
  try {
    const userId = req.user?.id;
    const playlistId = req.params.id;
    const playlist = await Playlist.getById(playlistId);
    if (!playlist) {
      return res.status(404).json({ success: false, message: 'Playlist not found' });
    }
    if (playlist.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    await Playlist.delete(playlistId);
    res.json({ success: true, message: 'Playlist deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPlaylistTracks = async (req, res) => {
  try {
    const userId = req.user?.id;
    const playlistId = req.params.id;
    const playlist = await Playlist.getById(playlistId);
    if (!playlist) {
      return res.status(404).json({ success: false, message: 'Playlist not found' });
    }
    if (playlist.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const tracks = await Playlist.getTracks(playlistId);
    res.json({ success: true, data: tracks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addTrackToPlaylist = async (req, res) => {
  try {
    const { trackId } = req.body;
    const userId = req.user?.id;
    const playlistId = req.params.id;
    if (!trackId) {
      return res.status(400).json({ success: false, message: 'trackId is required' });
    }
    const playlist = await Playlist.getById(playlistId);
    if (!playlist) {
      return res.status(404).json({ success: false, message: 'Playlist not found' });
    }
    if (playlist.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const result = await Playlist.addTrack(playlistId, trackId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const removeTrackFromPlaylist = async (req, res) => {
  try {
    const { trackId } = req.params;
    const userId = req.user?.id;
    const playlistId = req.params.id;
    const playlist = await Playlist.getById(playlistId);
    if (!playlist) {
      return res.status(404).json({ success: false, message: 'Playlist not found' });
    }
    if (playlist.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    await Playlist.removeTrack(playlistId, trackId);
    res.json({ success: true, message: 'Track removed from playlist' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllPlaylists,
  getPlaylistById,
  createPlaylist,
  deletePlaylist,
  getPlaylistTracks,
  addTrackToPlaylist,
  removeTrackFromPlaylist
};
