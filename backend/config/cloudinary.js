const cloudinary = require('cloudinary').v2;
const fs = require('fs');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Uploads a local file to Cloudinary and deletes the local temporary file.
 * @param {string} filePath Path to local file
 * @param {string} folder Target folder name on Cloudinary
 * @returns {Promise<string>} Secure URL of uploaded resource
 */
const uploadToCloudinary = async (filePath, folder = 'music-stream') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'auto'
    });
    // Delete local temp file synchronously
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return result.secure_url;
  } catch (error) {
    // Attempt cleanup even on failure
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (_) {}
    }
    console.error('Cloudinary Upload Error:', error);
    throw error;
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary
};
