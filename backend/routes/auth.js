const express = require('express');
const router = express.Router();

// Dummy routes (optional)
router.post('/register', (req, res) => {
  res.json({ success: true, message: "Public mode enabled. No registration required." });
});

router.post('/login', (req, res) => {
  res.json({ success: true, message: "Public mode enabled. No login required." });
});

router.get('/me', (req, res) => {
  res.json({ success: true, user: null });
});

module.exports = router;
