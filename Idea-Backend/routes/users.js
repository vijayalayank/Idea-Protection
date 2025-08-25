const express = require('express');
const router = express.Router();

// Simple user routes for development
router.get('/profile', (req, res) => {
  res.json({
    success: true,
    message: 'User profile endpoint (not implemented yet)'
  });
});

module.exports = router;
