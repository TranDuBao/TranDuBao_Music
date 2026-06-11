const multer = require('multer');
const path = require('path');
const fs = require('fs');

const audioDir  = path.resolve(__dirname, '../../uploads/audio');
const imgDir    = path.resolve(__dirname, '../../uploads/img');
[audioDir, imgDir].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

const AUDIO_TYPES = ['audio/mpeg','audio/wav','audio/ogg','audio/flac','audio/mp4','audio/x-m4a','audio/aac'];
const IMAGE_TYPES = ['image/jpeg','image/png','image/webp','image/gif'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'audio')  return cb(null, audioDir);
    if (file.fieldname === 'cover' || file.fieldname === 'avatar') return cb(null, imgDir);
    cb(new Error('Unknown field'), null);
  },
  filename: (req, file, cb) => {
    const u = `${Date.now()}-${Math.round(Math.random()*1e9)}`;
    cb(null, `${u}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'audio'  && AUDIO_TYPES.includes(file.mimetype)) return cb(null, true);
  if ((file.fieldname === 'cover' || file.fieldname === 'avatar') && IMAGE_TYPES.includes(file.mimetype)) return cb(null, true);
  cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 100 * 1024 * 1024 } });

module.exports = upload;
