const { query } = require('../config/db');

const getBannerSlides = async (req, res) => {
  try {
    const data = await query('SELECT * FROM banner_slides ORDER BY id DESC');
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createBannerSlide = async (req, res) => {
  try {
    const { image_url: bodyImageUrl } = req.body;
    let image_url = bodyImageUrl;

    if (req.file) {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
      image_url = `${backendUrl}/uploads/img/${req.file.filename}`;
    }

    if (!image_url) {
      return res.status(400).json({ success: false, message: 'Please provide an image URL or upload an image file.' });
    }

    const result = await query('INSERT INTO banner_slides (image_url) VALUES (?)', [image_url]);
    
    // Fetch inserted slide
    const insertedId = result.insertId;
    const inserted = await query('SELECT * FROM banner_slides WHERE id = ?', [insertedId]);

    res.status(201).json({ success: true, data: inserted[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteBannerSlide = async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM banner_slides WHERE id = ?', [id]);
    res.json({ success: true, message: 'Banner slide deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getBackground = async (req, res) => {
  try {
    const row = await query("SELECT value FROM settings WHERE key = 'background_image_url'");
    const value = row.length > 0 ? row[0].value : 'http://localhost:5000/uploads/img/the_weeknd.png';
    res.json({ success: true, value });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateBackground = async (req, res) => {
  try {
    const { background_image_url: bodyBgUrl } = req.body;
    let value = bodyBgUrl;

    if (req.file) {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
      value = `${backendUrl}/uploads/img/${req.file.filename}`;
    }

    if (value === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide background_image_url or upload a file.' });
    }

    // Check if key exists
    const exists = await query("SELECT COUNT(*) as c FROM settings WHERE key = 'background_image_url'");
    if (exists[0].c > 0) {
      await query("UPDATE settings SET value = ? WHERE key = 'background_image_url'", [value]);
    } else {
      await query("INSERT INTO settings (key, value) VALUES ('background_image_url', ?)", [value]);
    }

    res.json({ success: true, value, message: 'Background updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getBannerSlides,
  createBannerSlide,
  deleteBannerSlide,
  getBackground,
  updateBackground
};
