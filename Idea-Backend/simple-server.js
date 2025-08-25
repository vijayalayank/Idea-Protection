const express = require('express');
const cors = require('cors');
const multer = require('multer');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Mock data storage
const ideas = new Map();
let nextId = 1;

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    totalIdeas: ideas.size,
    architecture: 'mock-development'
  });
});

// Register idea
app.post('/api/ideas', upload.array('files', 5), (req, res) => {
  try {
    const {
      title,
      description,
      ownerAddress,
      isPrivate = false,
      password,
      category = 'other',
      tags = []
    } = req.body;

    // Validate required fields
    if (!title || !description || !ownerAddress) {
      return res.status(400).json({
        error: 'Missing required fields: title, description, ownerAddress'
      });
    }

    // Create idea
    const ideaId = nextId++;
    const transactionHash = `0x${Math.random().toString(16).substring(2, 66)}`;
    const metadataHash = `Qm${Math.random().toString(16).substring(2, 46)}`;

    const idea = {
      id: ideaId,
      title,
      description,
      ownerAddress: ownerAddress.toLowerCase(),
      isPrivate: isPrivate === 'true',
      category,
      tags: typeof tags === 'string' ? JSON.parse(tags) : tags,
      supportingFiles: req.files ? req.files.map(file => ({
        filename: file.originalname,
        size: file.size,
        mimetype: file.mimetype
      })) : [],
      timestamp: new Date().toISOString(),
      transactionHash,
      metadataHash,
      blockNumber: Math.floor(Math.random() * 1000000)
    };

    ideas.set(ideaId, idea);

    res.status(201).json({
      success: true,
      message: 'Idea registered successfully',
      data: {
        ideaId,
        transactionHash,
        metadataHash,
        explorerUrl: `https://mumbai.polygonscan.com/tx/${transactionHash}`
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: error.message
    });
  }
});

// Get public ideas
app.get('/api/ideas', (req, res) => {
  try {
    const { page = 1, limit = 10, search, category } = req.query;
    
    let publicIdeas = Array.from(ideas.values()).filter(idea => !idea.isPrivate);
    
    // Apply filters
    if (search) {
      publicIdeas = publicIdeas.filter(idea => 
        idea.title.toLowerCase().includes(search.toLowerCase()) ||
        idea.description.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (category) {
      publicIdeas = publicIdeas.filter(idea => idea.category === category);
    }

    // Sort by timestamp (newest first)
    publicIdeas.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const paginatedIdeas = publicIdeas.slice(startIndex, startIndex + parseInt(limit));

    res.json({
      success: true,
      data: paginatedIdeas,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: publicIdeas.length,
        hasMore: startIndex + parseInt(limit) < publicIdeas.length
      }
    });

  } catch (error) {
    console.error('Error fetching ideas:', error);
    res.status(500).json({
      error: 'Failed to fetch ideas',
      message: error.message
    });
  }
});

// Get idea details
app.get('/api/ideas/:id', (req, res) => {
  try {
    const ideaId = parseInt(req.params.id);
    const idea = ideas.get(ideaId);

    if (!idea) {
      return res.status(404).json({
        error: 'Idea not found'
      });
    }

    if (idea.isPrivate) {
      return res.json({
        success: true,
        data: {
          id: idea.id,
          title: 'Private Idea',
          description: 'This idea is private. Password required.',
          owner: idea.ownerAddress,
          timestamp: idea.timestamp,
          isPrivate: true,
          accessRequired: true
        }
      });
    }

    res.json({
      success: true,
      data: idea
    });

  } catch (error) {
    console.error('Error fetching idea:', error);
    res.status(500).json({
      error: 'Failed to fetch idea',
      message: error.message
    });
  }
});

// Get blockchain network info
app.get('/api/blockchain/network', (req, res) => {
  res.json({
    success: true,
    data: {
      network: {
        chainId: '80001',
        name: 'Mock Mumbai Testnet',
        blockNumber: Math.floor(Math.random() * 1000000) + 30000000
      },
      gasPrice: {
        gasPrice: '20000000000',
        maxFeePerGas: '30000000000'
      },
      connected: true
    }
  });
});

// Get platform stats
app.get('/api/blockchain/stats', (req, res) => {
  const publicIdeas = Array.from(ideas.values()).filter(idea => !idea.isPrivate);
  
  res.json({
    success: true,
    data: {
      totalPublicIdeas: publicIdeas.length,
      totalIdeas: ideas.size,
      network: {
        chainId: '80001',
        name: 'Mock Mumbai Testnet'
      },
      contractAddress: '0xMockContract123456789',
      explorerUrl: 'https://mumbai.polygonscan.com'
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Simple Backend Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 CORS enabled for: http://localhost:5173`);
  console.log(`💾 Using in-memory storage (${ideas.size} ideas)`);
});
