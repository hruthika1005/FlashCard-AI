const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const Flashcard = require('../models/Flashcard');
const Note = require('../models/Note');

/**
 * @desc    Get dashboard summary statistics for the authenticated user
 * @route   GET /api/stats/dashboard
 * @access  Private
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const now = new Date();

  const [
    totalFlashcards,
    dueToday,
    favoritesCount,
    totalNotesUploaded,
    difficultyBreakdown,
    subjectBreakdown,
  ] = await Promise.all([
    Flashcard.countDocuments({ user: userId }),
    Flashcard.countDocuments({ user: userId, nextReviewDate: { $lte: now } }),
    Flashcard.countDocuments({ user: userId, isFavorite: true }),
    Note.countDocuments({ user: userId }),
    Flashcard.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$difficulty', count: { $sum: 1 } } },
    ]),
    Flashcard.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$subject', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
  ]);

  new ApiResponse(200, {
    totalFlashcards,
    dueToday,
    favoritesCount,
    totalNotesUploaded,
    difficultyBreakdown,
    subjectBreakdown,
  }).send(res);
});

/**
 * @desc    Get detailed learning statistics: accuracy, streak, review history
 * @route   GET /api/stats/detailed
 * @access  Private
 */
const getDetailedStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [accuracyAgg, reviewedCards, cardsByChapter] = await Promise.all([
    Flashcard.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalCorrect: { $sum: '$correctCount' },
          totalIncorrect: { $sum: '$incorrectCount' },
        },
      },
    ]),
    Flashcard.find({ user: userId, lastReviewed: { $ne: null } })
      .select('lastReviewed reviewCount')
      .sort({ lastReviewed: -1 })
      .limit(30),
    Flashcard.aggregate([
      { $match: { user: userId } },
      { $group: { _id: { subject: '$subject', chapter: '$chapter' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  const totals = accuracyAgg[0] || { totalCorrect: 0, totalIncorrect: 0 };
  const totalAttempts = totals.totalCorrect + totals.totalIncorrect;
  const accuracyRate = totalAttempts > 0 ? Number(((totals.totalCorrect / totalAttempts) * 100).toFixed(1)) : 0;

  // Calculate a simple daily study streak from lastReviewed timestamps
  const reviewDates = [...new Set(reviewedCards.map((c) => c.lastReviewed.toISOString().slice(0, 10)))].sort(
    (a, b) => new Date(b) - new Date(a)
  );

  let streak = 0;
  let cursor = new Date();
  for (const dateStr of reviewDates) {
    const cursorStr = cursor.toISOString().slice(0, 10);
    if (dateStr === cursorStr) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  new ApiResponse(200, {
    accuracyRate,
    totalCorrect: totals.totalCorrect,
    totalIncorrect: totals.totalIncorrect,
    currentStreak: streak,
    recentReviews: reviewedCards,
    cardsByChapter,
  }).send(res);
});

module.exports = { getDashboardStats, getDetailedStats };
