const express = require('express');
const { uploadAndGenerate, getUploadHistory } = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { aiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(protect);

router.post('/generate', aiLimiter, upload.single('file'), uploadAndGenerate);
router.get('/history', getUploadHistory);

module.exports = router;
