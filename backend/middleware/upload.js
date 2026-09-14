const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

const baseUploadDir = process.env.UPLOADS_DIR || (
  fs.existsSync('/app/uploads')
    ? '/app/uploads'
    : path.resolve(__dirname, '../../uploads')
);
const audioDir = path.join(baseUploadDir, 'audio');
const imgDir   = path.join(baseUploadDir, 'img');
[audioDir, imgDir].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

const AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/mp4', 'audio/x-m4a', 'audio/aac'];
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Allowed file extensions (double-check against MIME spoofing)
const AUDIO_EXTS = new Set(['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac', '.mp4']);
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'audio')                                    return cb(null, audioDir);
    if (file.fieldname === 'cover' || file.fieldname === 'avatar')    return cb(null, imgDir);
    cb(new Error('Unknown field'), null);
  },
  filename: (req, file, cb) => {
    // Sanitize: use only timestamp+random, never original filename
    const u   = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${u}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (file.fieldname === 'audio') {
    if (AUDIO_TYPES.includes(file.mimetype) && AUDIO_EXTS.has(ext))
      return cb(null, true);
    return cb(new Error(`Unsupported audio type or extension: ${file.mimetype} / ${ext}`), false);
  }

  if (file.fieldname === 'cover' || file.fieldname === 'avatar') {
    if (IMAGE_TYPES.includes(file.mimetype) && IMAGE_EXTS.has(ext))
      return cb(null, true);
    return cb(new Error(`Unsupported image type or extension: ${file.mimetype} / ${ext}`), false);
  }

  cb(new Error(`Unknown field: ${file.fieldname}`), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024,  // 50 MB max per file (was 100MB)
    files: 2,                     // max 2 files per request
  }
});

module.exports = upload;
