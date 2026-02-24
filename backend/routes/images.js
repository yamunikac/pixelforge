const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  uploadImage,
  processImage,
  getHistory,
  deleteImage,
  getStats,
} = require('../controllers/imageController');

// All routes are protected
router.use(protect);

router.post('/upload', upload.single('image'), uploadImage);
router.post('/process/:id', processImage);
router.get('/history', getHistory);
router.get('/stats', getStats);
router.delete('/:id', deleteImage);

module.exports = router;
