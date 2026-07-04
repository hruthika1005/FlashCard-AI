const mongoose = require('mongoose');

const flashcardSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Organizational hierarchy
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      index: true,
    },
    chapter: {
      type: String,
      required: [true, 'Chapter is required'],
      trim: true,
    },
    topic: {
      type: String,
      required: [true, 'Topic is required'],
      trim: true,
    },
    // Core content
    question: {
      type: String,
      required: [true, 'Question is required'],
      trim: true,
    },
    answer: {
      type: String,
      required: [true, 'Answer is required'],
      trim: true,
    },
    mnemonic: {
      type: String,
      default: '',
      trim: true,
    },
    highlightedConcepts: {
      type: [String],
      default: [],
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    isFavorite: {
      type: Boolean,
      default: false,
      index: true,
    },
    // Source tracking
    sourceNoteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Note',
      default: null,
    },
    // Spaced repetition scheduling (SM-2 algorithm fields)
    easeFactor: {
      type: Number,
      default: 2.5,
    },
    interval: {
      type: Number,
      default: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    lastReviewed: {
      type: Date,
      default: null,
    },
    nextReviewDate: {
      type: Date,
      default: () => new Date(), // due immediately until first review
      index: true,
    },
    // Quiz statistics
    correctCount: {
      type: Number,
      default: 0,
    },
    incorrectCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: { createdAt: 'createdDate', updatedAt: 'updatedAt' } }
);

// Compound index to speed up the common "my due cards" query
flashcardSchema.index({ user: 1, nextReviewDate: 1 });
// Text index to support full-text search across question/answer/tags
flashcardSchema.index({ question: 'text', answer: 'text', tags: 'text', subject: 'text', topic: 'text' });

module.exports = mongoose.model('Flashcard', flashcardSchema);
