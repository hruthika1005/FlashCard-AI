const express = require('express');
const { param } = require('express-validator');
const {
  uploadAndGenerate,
  getUploadHistory,
  saveNote,
  generateForExistingNote,
  deleteNote,
} = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { aiLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validateMiddleware');

const router = express.Router();

router.use(protect);

// Save Notes: upload + persist only, no OCR/generation
router.post('/save', upload.single('file'), saveNote);

// Save Notes & Generate Flashcards: upload + persist + OCR + AI generation
router.post('/generate', aiLimiter, upload.single('file'), uploadAndGenerate);

// Generate flashcards later for a note that was previously saved without them
router.post(
  '/:noteId/generate',
  aiLimiter,
  param('noteId').isMongoId(),
  validate,
  generateForExistingNote
);

router.get('/history', getUploadHistory);

router.delete('/:noteId', param('noteId').isMongoId(), validate, deleteNote);

module.exports = router;
