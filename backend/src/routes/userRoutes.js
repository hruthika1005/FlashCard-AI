const express = require('express');
const { body } = require('express-validator');
const { updateProfile, updateAvatar } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.use(protect);

router.put(
  '/profile',
  [
    body('name').optional().trim().isLength({ min: 2, max: 50 }),
    body('bio').optional().isLength({ max: 300 }),
    body('theme').optional().isIn(['light', 'dark']),
    body('dailyGoal').optional().isInt({ min: 1 }),
  ],
  validate,
  updateProfile
);

router.put('/avatar', upload.single('avatar'), updateAvatar);

module.exports = router;
