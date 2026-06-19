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

/**
 * Deletes an asset from Cloudinary using its secure URL.
 * @param {string} cloudinaryUrl Secure URL of the Cloudinary asset
 * @returns {Promise<any>}
 */
const deleteFromCloudinary = async (cloudinaryUrl) => {
  if (!cloudinaryUrl || !cloudinaryUrl.includes('cloudinary.com')) return;
  try {
    const parts = cloudinaryUrl.split('/upload/');
    if (parts.length < 2) return;
    
    const publicIdWithVersionAndExt = parts[1];
    const subParts = publicIdWithVersionAndExt.split('/');
    let publicIdWithExt;
    
    if (subParts[0].startsWith('v') && !isNaN(subParts[0].substring(1))) {
      publicIdWithExt = subParts.slice(1).join('/');
    } else {
      publicIdWithExt = subParts.join('/');
    }
    
    const lastDotIndex = publicIdWithExt.lastIndexOf('.');
    const publicId = lastDotIndex !== -1 ? publicIdWithExt.substring(0, lastDotIndex) : publicIdWithExt;
    
    let resourceType = 'image';
    if (cloudinaryUrl.includes('/video/') || cloudinaryUrl.includes('/audio/')) {
      resourceType = 'video';
    } else if (cloudinaryUrl.includes('/raw/')) {
      resourceType = 'raw';
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    console.log(`Deleted Cloudinary asset ${publicId}:`, result);
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary
};
