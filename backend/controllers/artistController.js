const { query } = require('../config/db');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

const GLOW_CLASSES = [
  'group-hover:shadow-[0_0_30px_rgba(168,85,247,0.35)] group-hover:border-purple-500/30',
  'group-hover:shadow-[0_0_30px_rgba(236,72,153,0.35)] group-hover:border-pink-500/30',
  'group-hover:shadow-[0_0_30px_rgba(59,130,246,0.35)] group-hover:border-blue-500/30',
  'group-hover:shadow-[0_0_30px_rgba(16,185,129,0.35)] group-hover:border-emerald-500/30',
  'group-hover:shadow-[0_0_30px_rgba(245,158,11,0.35)] group-hover:border-amber-500/30'
];

const getAllArtists = async (req, res) => {
  try {
    const data = await query('SELECT * FROM featured_artists ORDER BY id DESC');
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createArtist = async (req, res) => {
  try {
    const { name, genre, listeners, bio, popular_track, image_url: bodyImageUrl } = req.body;
    if (!name || !genre || !listeners || !bio || !popular_track) {
      return res.status(400).json({ success: false, message: 'Please provide name, genre, listeners, bio, and popular track.' });
    }

    let image_url = bodyImageUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500';
    if (req.file) {
      image_url = await uploadToCloudinary(req.file.path, 'music-stream/artists');
    }

    // Pick a glow class randomly
    const glow_class = GLOW_CLASSES[Math.floor(Math.random() * GLOW_CLASSES.length)];

    const result = await query(
      'INSERT INTO featured_artists (name, genre, listeners, bio, image_url, glow_class, popular_track) VALUES (?,?,?,?,?,?,?)',
      [name, genre, listeners, bio, image_url, glow_class, popular_track]
    );

    // Fetch the inserted artist
    const insertedId = result.insertId;
    const insertedArtist = await query('SELECT * FROM featured_artists WHERE id = ?', [insertedId]);

    res.status(201).json({ success: true, data: insertedArtist[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteArtist = async (req, res) => {
  try {
    const { id } = req.params;
    const artist = await query('SELECT image_url FROM featured_artists WHERE id = ?', [id]);
    if (artist && artist.length > 0) {
      await deleteFromCloudinary(artist[0].image_url);
    }
    await query('DELETE FROM featured_artists WHERE id = ?', [id]);
    res.json({ success: true, message: 'Artist deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateArtist = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, genre, listeners, bio, popular_track, image_url: bodyImageUrl } = req.body;
    
    if (!name || !genre || !listeners || !bio || !popular_track) {
      return res.status(400).json({ success: false, message: 'Please provide name, genre, listeners, bio, and popular track.' });
    }

    const artist = await query('SELECT * FROM featured_artists WHERE id = ?', [id]);
    if (!artist || artist.length === 0) {
      return res.status(404).json({ success: false, message: 'Artist not found' });
    }

    let image_url = artist[0].image_url;
    if (req.file) {
      await deleteFromCloudinary(artist[0].image_url);
      image_url = await uploadToCloudinary(req.file.path, 'music-stream/artists');
    } else if (bodyImageUrl !== undefined) {
      image_url = bodyImageUrl;
    }

    await query(
      'UPDATE featured_artists SET name = ?, genre = ?, listeners = ?, bio = ?, image_url = ?, popular_track = ? WHERE id = ?',
      [name, genre, listeners, bio, image_url, popular_track, id]
    );

    const updated = await query('SELECT * FROM featured_artists WHERE id = ?', [id]);
    res.json({ success: true, data: updated[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAllArtists,
  createArtist,
  deleteArtist,
  updateArtist
};
