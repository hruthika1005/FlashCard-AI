const mongoose = require('mongoose');

/**
 * Represents an uploaded source document (PDF or image) that notes/flashcards
 * were generated from. Keeps a record of the raw extracted text and links
 * to the flashcards it produced, so users can trace provenance or regenerate.
 */
const noteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    originalFileName: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    filePublicId: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      enum: ['pdf', 'image'],
      required: true,
    },
    extractedText: {
      type: String,
      default: '',
    },
    subject: {
      type: String,
      default: 'General',
      trim: true,
    },
    chapter: {
      type: String,
      default: 'Uncategorized',
      trim: true,
    },
    topic: {
      type: String,
      default: 'Uncategorized',
      trim: true,
    },
    status: {
      type: String,
      enum: ['uploaded', 'ocr_processing', 'ocr_complete', 'generating_flashcards', 'completed', 'failed'],
      default: 'uploaded',
    },
    errorMessage: {
      type: String,
      default: '',
    },
    flashcardsGenerated: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Note', noteSchema);
