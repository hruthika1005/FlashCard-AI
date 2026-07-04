const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const cloudinary = require('../config/cloudinary');
const Note = require('../models/Note');
const Flashcard = require('../models/Flashcard');
const { extractText } = require('../services/ocrService');
const { generateFlashcardsFromText } = require('../services/aiService');
const logger = require('../utils/logger');

const detectFileType = (mimetype) => (mimetype === 'application/pdf' ? 'pdf' : 'image');

/**
 * Uploads the raw file buffer to Cloudinary. PDFs are stored as 'raw'
 * resource type, images as 'image'.
 */
async function uploadBufferToCloudinary(buffer, fileType) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'flashcard-app/notes',
        resource_type: fileType === 'pdf' ? 'raw' : 'image',
      },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(buffer);
  });
}

/**
 * @desc    Upload a note file (PDF/image), run OCR, generate flashcards via AI,
 *          and persist everything in one pipeline.
 * @route   POST /api/upload/generate
 * @access  Private
 */
const uploadAndGenerate = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest('No file uploaded. Please attach a PDF or image.');
  }

  const { subject, chapter, topic } = req.body;
  const fileType = detectFileType(req.file.mimetype);

  // 1. Persist the original file to Cloudinary for later reference
  const cloudinaryResult = await uploadBufferToCloudinary(req.file.buffer, fileType);

  const note = await Note.create({
    user: req.user._id,
    originalFileName: req.file.originalname,
    fileUrl: cloudinaryResult.secure_url,
    filePublicId: cloudinaryResult.public_id,
    fileType,
    subject: subject || 'General',
    chapter: chapter || 'Uncategorized',
    topic: topic || 'Uncategorized',
    status: 'ocr_processing',
  });

  try {
    // 2. Extract text via OCR / PDF parsing
    const extractedText = await extractText(req.file.buffer, fileType);
    note.extractedText = extractedText;
    note.status = 'generating_flashcards';
    await note.save();

    // 3. Generate flashcards via OpenAI, grounded strictly in the extracted text
    const generatedCards = await generateFlashcardsFromText(extractedText, { subject, chapter, topic });

    // 4. Persist flashcards
    const flashcardDocs = generatedCards.map((card) => ({
      user: req.user._id,
      subject: subject || card.subject,
      chapter: chapter || card.chapter,
      topic: topic || card.topic,
      question: card.question,
      answer: card.answer,
      mnemonic: card.mnemonic || '',
      highlightedConcepts: card.highlightedConcepts || [],
      difficulty: card.difficulty || 'medium',
      tags: card.tags || [],
      sourceNoteId: note._id,
    }));

    const savedFlashcards = await Flashcard.insertMany(flashcardDocs);

    note.status = 'completed';
    note.flashcardsGenerated = savedFlashcards.length;
    await note.save();

    new ApiResponse(
      201,
      { note, flashcards: savedFlashcards },
      `Successfully generated ${savedFlashcards.length} flashcards`
    ).send(res);
  } catch (error) {
    note.status = 'failed';
    note.errorMessage = error.message;
    await note.save().catch(() => null);
    logger.error(`Upload pipeline failed for note ${note._id}: ${error.message}`);
    throw error;
  }
});

/**
 * @desc    Get upload history (notes) for the authenticated user
 * @route   GET /api/upload/history
 * @access  Private
 */
const getUploadHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const pageNum = Math.max(Number(page), 1);
  const limitNum = Math.min(Math.max(Number(limit), 1), 50);

  const [notes, total] = await Promise.all([
    Note.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Note.countDocuments({ user: req.user._id }),
  ]);

  new ApiResponse(200, {
    notes,
    pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
  }).send(res);
});

module.exports = { uploadAndGenerate, getUploadHistory };
