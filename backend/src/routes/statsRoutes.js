const express = require('express');
const { getDashboardStats, getDetailedStats } = require('../controllers/statsController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/dashboard', getDashboardStats);
router.get('/detailed', getDetailedStats);

module.exports = router;
