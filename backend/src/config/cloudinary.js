const cloudinary = require('cloudinary').v2;
const logger = require('../utils/logger');

/**
 * Configures the Cloudinary SDK using credentials from environment variables.
 * Used to store uploaded note images/PDFs so they can be referenced later
 * and re-processed if needed.
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
  logger.warn('Cloudinary credentials are missing. File uploads to Cloudinary will fail.');
}

module.exports = cloudinary;
