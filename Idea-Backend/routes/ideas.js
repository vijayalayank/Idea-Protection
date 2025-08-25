const express = require('express');
const multer = require('multer');
const { body, validationResult, param, query } = require('express-validator');

const decentralizedDataService = require('../services/decentralizedDataService');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files
  },
  fileFilter: (req, file, cb) => {
    // Allow common document types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Validation middleware
const validateIdeaRegistration = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Description must be between 10 and 5000 characters'),
  body('ownerAddress')
    .isEthereumAddress()
    .withMessage('Invalid Ethereum address'),
  body('isPrivate')
    .optional()
    .isBoolean()
    .withMessage('isPrivate must be a boolean'),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('category')
    .optional()
    .isIn(['technology', 'business', 'creative', 'scientific', 'other'])
    .withMessage('Invalid category'),
  body('tags')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Tags must be an array with maximum 10 items')
];

// POST /api/ideas - Register a new idea (Fully Decentralized)
router.post('/', upload.array('files', 5), validateIdeaRegistration, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      title,
      description,
      ownerAddress,
      isPrivate = false,
      password,
      category = 'other',
      tags = []
    } = req.body;

    // Validate password for private ideas
    if (isPrivate && !password) {
      return res.status(400).json({
        error: 'Password required for private ideas'
      });
    }

    // Prepare supporting files
    const supportingFiles = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        supportingFiles.push({
          buffer: file.buffer,
          originalname: file.originalname,
          size: file.size,
          mimetype: file.mimetype
        });
      }
    }

    // Register idea using decentralized service
    const result = await decentralizedDataService.registerIdea({
      title,
      description,
      ownerAddress,
      isPrivate,
      password,
      category,
      tags,
      supportingFiles,
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip,
      browserFingerprint: req.get('X-Browser-Fingerprint')
    });

    res.status(201).json({
      success: true,
      message: 'Idea registered successfully on decentralized network',
      data: result
    });

  } catch (error) {
    console.error('Decentralized idea registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: error.message
    });
  }
});

// GET /api/ideas - Get public ideas from decentralized network
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().isIn(['technology', 'business', 'creative', 'scientific', 'other']),
  query('search').optional().isLength({ max: 100 }).withMessage('Search query too long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      page = 1,
      limit = 10,
      category,
      tags,
      search
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let ideas;

    if (search || category || tags) {
      // Use search functionality
      const filters = {};
      if (category) filters.category = category;
      if (tags) filters.tags = tags.split(',');

      ideas = await decentralizedDataService.searchIdeas(search, filters);

      // Apply pagination to search results
      ideas = ideas.slice(offset, offset + parseInt(limit));
    } else {
      // Get ideas directly from blockchain + IPFS
      ideas = await decentralizedDataService.getPublicIdeas(offset, parseInt(limit));
    }

    res.json({
      success: true,
      data: ideas,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: ideas.length === parseInt(limit)
      },
      source: 'decentralized'
    });

  } catch (error) {
    console.error('Error fetching decentralized ideas:', error);
    res.status(500).json({
      error: 'Failed to fetch ideas from decentralized network',
      message: error.message
    });
  }
});

// GET /api/ideas/stats - Get platform statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await Idea.getStats();
    const blockchainStats = await blockchainService.getTotalPublicIdeas();

    res.json({
      success: true,
      data: {
        database: stats[0] || {
          totalIdeas: 0,
          publicIdeas: 0,
          privateIdeas: 0,
          confirmedIdeas: 0,
          pendingIdeas: 0
        },
        blockchain: {
          totalPublicIdeas: blockchainStats
        }
      }
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
});

module.exports = router;
