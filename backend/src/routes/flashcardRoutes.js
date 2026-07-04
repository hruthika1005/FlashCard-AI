const express = require('express');
const { body, param, query } = require('express-validator');
const {
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
} = require('../controllers/flashcardController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');

const router = express.Router();

router.use(protect);

const flashcardBodyRules = [
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('chapter').trim().notEmpty().withMessage('Chapter is required'),
  body('topic').trim().notEmpty().withMessage('Topic is required'),
  body('question').trim().notEmpty().withMessage('Question is required'),
  body('answer').trim().notEmpty().withMessage('Answer is required'),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard']),
  body('tags').optional().isArray(),
];

// Specific routes MUST come before the generic '/:id' route
router.get('/study/due', getDueFlashcards);
router.get('/meta/categories', getCategories);

router.get('/', getFlashcards);
router.post('/', flashcardBodyRules, validate, createFlashcard);

router.get('/:id', param('id').isMongoId(), validate, getFlashcardById);
router.put('/:id', [param('id').isMongoId(), ...flashcardBodyRules], validate, updateFlashcard);
router.delete('/:id', param('id').isMongoId(), validate, deleteFlashcard);

router.patch('/:id/favorite', param('id').isMongoId(), validate, toggleFavorite);
router.post(
  '/:id/review',
  [param('id').isMongoId(), body('quality').isInt({ min: 0, max: 5 })],
  validate,
  reviewFlashcard
);
router.post(
  '/:id/quiz-result',
  [param('id').isMongoId(), body('correct').isBoolean()],
  validate,
  submitQuizResult
);

module.exports = router;
