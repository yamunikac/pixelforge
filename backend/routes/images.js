const express = require('express');
const router = express.Router();
// const { protect } = require('../middleware/auth'); ❌ REMOVE THIS
const upload = require('../middleware/upload');
const {
  uploadImage,
  processImage,
  getHistory,
  deleteImage,
  getStats,
} = require('../controllers/imageController');

// ❌ REMOVE THIS LINE
// router.use(protect);

router.post('/upload', upload.single('image'), uploadImage);
router.post('/process/:id', processImage);
router.get('/history', getHistory);
router.get('/stats', getStats);
router.delete('/:id', deleteImage);

module.exports = router;
