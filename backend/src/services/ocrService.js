const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

async function extractTextFromImage(buffer) {
  try {
    const { data } = await Tesseract.recognize(buffer, 'eng');

    const text = data.text || '';

    if (!text.trim()) {
      throw ApiError.badRequest(
        'No readable text was found in the uploaded image'
      );
    }

    return text;
  } catch (error) {
    if (error instanceof ApiError) throw error;

    logger.error(`Tesseract OCR failed: ${error.message}`);
    throw ApiError.internal('Failed to extract text from image');
  }
}

async function extractTextFromPdf(buffer) {
  try {
    const data = await pdfParse(buffer);

    const text = data.text || '';

    if (!text.trim()) {
      throw ApiError.badRequest(
        'This PDF contains no selectable text. Please upload it as an image.'
      );
    }

    return text;
  } catch (error) {
    if (error instanceof ApiError) throw error;

    logger.error(`PDF extraction failed: ${error.message}`);
    throw ApiError.internal('Failed to extract text from PDF');
  }
}

async function extractText(buffer, fileType) {
  if (fileType === 'pdf') {
    return extractTextFromPdf(buffer);
  }

  if (fileType === 'image') {
    return extractTextFromImage(buffer);
  }

  throw ApiError.badRequest('Unsupported file type');
}

module.exports = {
  extractText,
  extractTextFromImage,
  extractTextFromPdf,
};