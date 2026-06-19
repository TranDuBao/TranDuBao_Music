const { query } = require('../config/db');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

const getBannerSlides = async (req, res) => {
  try {
    const data = await query('SELECT * FROM banner_slides ORDER BY position ASC, id DESC');
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
      image_url = await uploadToCloudinary(req.file.path, 'music-stream/banners');
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
    const row = await query("SELECT value FROM settings WHERE `key` = 'background_image_url'");
    const value = row.length > 0 ? row[0].value : '/uploads/img/the_weeknd.png';
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
      value = await uploadToCloudinary(req.file.path, 'music-stream/backgrounds');
    }

    if (value === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide background_image_url or upload a file.' });
    }

    // Check if key exists
    const exists = await query("SELECT COUNT(*) as c FROM settings WHERE `key` = 'background_image_url'");
    if (exists[0].c > 0) {
      await query("UPDATE settings SET value = ? WHERE `key` = 'background_image_url'", [value]);
    } else {
      await query("INSERT INTO settings (`key`, `value`) VALUES ('background_image_url', ?)", [value]);
    }

    res.json({ success: true, value, message: 'Background updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getYoutubeCookies = async (req, res) => {
  try {
    const row = await query("SELECT value FROM settings WHERE `key` = 'youtube_cookies'");
    const value = row.length > 0 ? row[0].value : '';
    res.json({ success: true, value });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateYoutubeCookies = async (req, res) => {
  try {
    const { value } = req.body;
    if (value === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide cookies value.' });
    }

    // Save YouTube cookies
    const exists = await query("SELECT COUNT(*) as c FROM settings WHERE `key` = 'youtube_cookies'");
    if (exists[0].c > 0) {
      await query("UPDATE settings SET value = ? WHERE `key` = 'youtube_cookies'", [value]);
    } else {
      await query("INSERT INTO settings (`key`, `value`) VALUES ('youtube_cookies', ?)", [value]);
    }

    // Automatically capture and save User-Agent from the client that submitted the cookies
    const userAgent = req.headers['user-agent'] || '';
    if (userAgent) {
      const uaExists = await query("SELECT COUNT(*) as c FROM settings WHERE `key` = 'youtube_user_agent'");
      if (uaExists[0].c > 0) {
        await query("UPDATE settings SET value = ? WHERE `key` = 'youtube_user_agent'", [userAgent]);
      } else {
        await query("INSERT INTO settings (`key`, `value`) VALUES ('youtube_user_agent', ?)", [userAgent]);
      }
    }

    res.json({ success: true, value, message: 'YouTube Cookies and User-Agent updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getBackdrops = async (req, res) => {
  try {
    const data = await query("SELECT * FROM backdrops ORDER BY position ASC, id DESC");
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createBackdrop = async (req, res) => {
  try {
    const { image_url: bodyUrl } = req.body;
    let url = bodyUrl;

    if (req.file) {
      url = await uploadToCloudinary(req.file.path, 'music-stream/backgrounds');
    }

    if (!url) {
      return res.status(400).json({ success: false, message: 'Please upload a file or provide an image URL.' });
    }

    const result = await query("INSERT INTO backdrops (image_url) VALUES (?)", [url]);
    const id = result.insertId;

    res.json({ success: true, data: { id, image_url: url }, message: 'Backdrop added successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteBackdrop = async (req, res) => {
  try {
    const { id } = req.params;
    const row = await query("SELECT image_url FROM backdrops WHERE id = ?", [id]);
    if (row.length === 0) {
      return res.status(404).json({ success: false, message: 'Backdrop not found.' });
    }

    await deleteFromCloudinary(row[0].image_url);
    await query("DELETE FROM backdrops WHERE id = ?", [id]);
    
    res.json({ success: true, message: 'Backdrop deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const reorderBannerSlides = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
      return res.status(400).json({ success: false, message: 'Invalid list of IDs' });
    }
    for (let index = 0; index < ids.length; index++) {
      const id = ids[index];
      await query('UPDATE banner_slides SET position = ? WHERE id = ?', [index, id]);
    }
    res.json({ success: true, message: 'Banner slides reordered successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const reorderBackdrops = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
      return res.status(400).json({ success: false, message: 'Invalid list of IDs' });
    }
    for (let index = 0; index < ids.length; index++) {
      const id = ids[index];
      await query('UPDATE backdrops SET position = ? WHERE id = ?', [index, id]);
    }
    res.json({ success: true, message: 'Backdrops reordered successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getBannerSlides,
  createBannerSlide,
  deleteBannerSlide,
  getBackground,
  updateBackground,
  getBackdrops,
  createBackdrop,
  deleteBackdrop,
  getYoutubeCookies,
  updateYoutubeCookies,
  reorderBannerSlides,
  reorderBackdrops
};
