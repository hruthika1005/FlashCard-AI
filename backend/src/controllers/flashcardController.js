const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Flashcard = require('../models/Flashcard');
const { calculateNextReview } = require('../utils/spacedRepetition');

/**
 * @desc    Create a single flashcard manually
 * @route   POST /api/flashcards
 * @access  Private
 */
const createFlashcard = asyncHandler(async (req, res) => {
  const { subject, chapter, topic, question, answer, difficulty, tags, mnemonic, highlightedConcepts } = req.body;

  const flashcard = await Flashcard.create({
    user: req.user._id,
    subject,
    chapter,
    topic,
    question,
    answer,
    difficulty,
    tags,
    mnemonic,
    highlightedConcepts,
  });

  new ApiResponse(201, { flashcard }, 'Flashcard created successfully').send(res);
});

/**
 * @desc    Get flashcards for the authenticated user with search, filters & pagination
 * @route   GET /api/flashcards
 * @query   page, limit, search, subject, chapter, topic, difficulty, tag, favorite, dueOnly, sortBy, order
 * @access  Private
 */
const getFlashcards = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 12,
    search,
    subject,
    chapter,
    topic,
    difficulty,
    tag,
    favorite,
    dueOnly,
    sourceNoteId,
    sortBy = 'createdDate',
    order = 'desc',
  } = req.query;

  const query = { user: req.user._id };

  if (search) {
    query.$text = { $search: search };
  }
  if (subject) query.subject = subject;
  if (chapter) query.chapter = chapter;
  if (topic) query.topic = topic;
  if (difficulty) query.difficulty = difficulty;
  if (tag) query.tags = tag;
  if (favorite === 'true') query.isFavorite = true;
  if (dueOnly === 'true') query.nextReviewDate = { $lte: new Date() };
  if (sourceNoteId) query.sourceNoteId = sourceNoteId;

  const pageNum = Math.max(Number(page), 1);
  const limitNum = Math.min(Math.max(Number(limit), 1), 100);
  const skip = (pageNum - 1) * limitNum;

  const sortDirection = order === 'asc' ? 1 : -1;
  const sortOptions = search ? { score: { $meta: 'textScore' } } : { [sortBy]: sortDirection };

  const [flashcards, total] = await Promise.all([
    Flashcard.find(query, search ? { score: { $meta: 'textScore' } } : {})
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum),
    Flashcard.countDocuments(query),
  ]);

  new ApiResponse(200, {
    flashcards,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  }).send(res);
});

/**
 * @desc    Get a single flashcard by id
 * @route   GET /api/flashcards/:id
 * @access  Private
 */
const getFlashcardById = asyncHandler(async (req, res) => {
  const flashcard = await Flashcard.findOne({ _id: req.params.id, user: req.user._id });
  if (!flashcard) throw ApiError.notFound('Flashcard not found');
  new ApiResponse(200, { flashcard }).send(res);
});

/**
 * @desc    Update a flashcard (question, answer, tags, difficulty, etc.)
 * @route   PUT /api/flashcards/:id
 * @access  Private
 */
const updateFlashcard = asyncHandler(async (req, res) => {
  const allowedFields = [
    'subject',
    'chapter',
    'topic',
    'question',
    'answer',
    'difficulty',
    'tags',
    'mnemonic',
    'highlightedConcepts',
  ];

  const flashcard = await Flashcard.findOne({ _id: req.params.id, user: req.user._id });
  if (!flashcard) throw ApiError.notFound('Flashcard not found');

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      flashcard[field] = req.body[field];
    }
  });

  await flashcard.save();
  new ApiResponse(200, { flashcard }, 'Flashcard updated successfully').send(res);
});

/**
 * @desc    Delete a flashcard
 * @route   DELETE /api/flashcards/:id
 * @access  Private
 */
const deleteFlashcard = asyncHandler(async (req, res) => {
  const flashcard = await Flashcard.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!flashcard) throw ApiError.notFound('Flashcard not found');
  new ApiResponse(200, null, 'Flashcard deleted successfully').send(res);
});

/**
 * @desc    Toggle favorite status
 * @route   PATCH /api/flashcards/:id/favorite
 * @access  Private
 */
const toggleFavorite = asyncHandler(async (req, res) => {
  const flashcard = await Flashcard.findOne({ _id: req.params.id, user: req.user._id });
  if (!flashcard) throw ApiError.notFound('Flashcard not found');

  flashcard.isFavorite = !flashcard.isFavorite;
  await flashcard.save();

  new ApiResponse(200, { flashcard }, `Flashcard ${flashcard.isFavorite ? 'added to' : 'removed from'} favorites`).send(res);
});

/**
 * @desc    Get flashcards due for review today (Study Mode), grouped by SM-2 schedule
 * @route   GET /api/flashcards/study/due
 * @access  Private
 */
const getDueFlashcards = asyncHandler(async (req, res) => {
  const { subject, limit = 50 } = req.query;

  const query = { user: req.user._id, nextReviewDate: { $lte: new Date() } };
  if (subject) query.subject = subject;

  const flashcards = await Flashcard.find(query)
    .sort({ nextReviewDate: 1 })
    .limit(Math.min(Number(limit), 200));

  new ApiResponse(200, { flashcards, count: flashcards.length }).send(res);
});

/**
 * @desc    Submit a study review result and reschedule via SM-2 spaced repetition
 * @route   POST /api/flashcards/:id/review
 * @body    { quality } - integer 0-5 recall quality
 * @access  Private
 */
const reviewFlashcard = asyncHandler(async (req, res) => {
  const { quality } = req.body;

  if (quality === undefined || quality < 0 || quality > 5) {
    throw ApiError.badRequest('quality must be an integer between 0 and 5');
  }

  const flashcard = await Flashcard.findOne({ _id: req.params.id, user: req.user._id });
  if (!flashcard) throw ApiError.notFound('Flashcard not found');

  const schedule = calculateNextReview({
    quality,
    previousEaseFactor: flashcard.easeFactor,
    previousInterval: flashcard.interval,
    reviewCount: flashcard.reviewCount,
  });

  Object.assign(flashcard, schedule);
  await flashcard.save();

  new ApiResponse(200, { flashcard }, 'Review recorded').send(res);
});

/**
 * @desc    Submit a quiz answer result (separate from spaced-repetition review)
 * @route   POST /api/flashcards/:id/quiz-result
 * @body    { correct } - boolean
 * @access  Private
 */
const submitQuizResult = asyncHandler(async (req, res) => {
  const { correct } = req.body;

  const flashcard = await Flashcard.findOne({ _id: req.params.id, user: req.user._id });
  if (!flashcard) throw ApiError.notFound('Flashcard not found');

  if (correct) {
    flashcard.correctCount += 1;
  } else {
    flashcard.incorrectCount += 1;
  }
  await flashcard.save();

  new ApiResponse(200, { flashcard }, 'Quiz result recorded').send(res);
});

/**
 * @desc    Get distinct subjects/chapters/topics for the authenticated user, for filter dropdowns
 * @route   GET /api/flashcards/meta/categories
 * @access  Private
 */
const getCategories = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const [subjects, chapters, topics, tags] = await Promise.all([
    Flashcard.distinct('subject', { user: userId }),
    Flashcard.distinct('chapter', { user: userId }),
    Flashcard.distinct('topic', { user: userId }),
    Flashcard.distinct('tags', { user: userId }),
  ]);

  new ApiResponse(200, { subjects, chapters, topics, tags }).send(res);
});

module.exports = {
  createFlashcard,
  getFlashcards,
  getFlashcardById,
  updateFlashcard,
  deleteFlashcard,
  toggleFavorite,
  getDueFlashcards,
  reviewFlashcard,
  submitQuizResult,
  getCategories,
};
