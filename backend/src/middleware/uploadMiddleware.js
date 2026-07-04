const multer = require('multer');
const ApiError = require('../utils/ApiError');

// Store files in memory as Buffers so they can be streamed straight to
// Cloudinary and to the OCR service without touching disk.
const storage = multer.memoryStorage();

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(ApiError.badRequest(`Unsupported file type: ${file.mimetype}. Only PDF, JPG, PNG, WEBP are allowed.`));
  }
};

const maxSizeMb = Number(process.env.MAX_FILE_UPLOAD_MB) || 10;

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxSizeMb * 1024 * 1024 },
});

module.exports = upload;
