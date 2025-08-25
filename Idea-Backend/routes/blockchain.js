const express = require('express');
const { body, validationResult, param } = require('express-validator');
const blockchainService = require('../services/mockBlockchainService');

const router = express.Router();

// GET /api/blockchain/network - Get network information
router.get('/network', async (req, res) => {
  try {
    const networkInfo = await blockchainService.getNetworkInfo();
    const gasPrice = await blockchainService.getGasPrice();

    res.json({
      success: true,
      data: {
        network: networkInfo,
        gasPrice,
        connected: blockchainService.isConnected()
      }
    });

  } catch (error) {
    console.error('Error getting network info:', error);
    res.status(500).json({
      error: 'Failed to get network information',
      message: error.message
    });
  }
});

// GET /api/blockchain/ideas/public - Get public ideas from blockchain
router.get('/ideas/public', async (req, res) => {
  try {
    const { offset = 0, limit = 10 } = req.query;
    
    const ideas = await blockchainService.getPublicIdeas(
      parseInt(offset),
      parseInt(limit)
    );

    res.json({
      success: true,
      data: ideas
    });

  } catch (error) {
    console.error('Error fetching blockchain ideas:', error);
    res.status(500).json({
      error: 'Failed to fetch ideas from blockchain',
      message: error.message
    });
  }
});

// GET /api/blockchain/ideas/:id - Get specific idea details
router.get('/ideas/:id', [
  param('id').isNumeric().withMessage('Idea ID must be numeric')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const { password = '' } = req.query;

    const idea = await blockchainService.getIdeaDetails(id, password);

    res.json({
      success: true,
      data: idea
    });

  } catch (error) {
    console.error('Error fetching idea details:', error);
    res.status(500).json({
      error: 'Failed to fetch idea details',
      message: error.message
    });
  }
});

// POST /api/blockchain/verify-ownership - Verify idea ownership
router.post('/verify-ownership', [
  body('ideaId').isNumeric().withMessage('Idea ID must be numeric'),
  body('ownerAddress').isEthereumAddress().withMessage('Invalid Ethereum address')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { ideaId, ownerAddress } = req.body;

    const isOwner = await blockchainService.verifyOwnership(ideaId, ownerAddress);

    res.json({
      success: true,
      data: {
        ideaId,
        ownerAddress,
        isOwner
      }
    });

  } catch (error) {
    console.error('Error verifying ownership:', error);
    res.status(500).json({
      error: 'Failed to verify ownership',
      message: error.message
    });
  }
});

// GET /api/blockchain/stats - Get blockchain statistics
router.get('/stats', async (req, res) => {
  try {
    const totalPublicIdeas = await blockchainService.getTotalPublicIdeas();
    const networkInfo = await blockchainService.getNetworkInfo();

    res.json({
      success: true,
      data: {
        totalPublicIdeas,
        network: networkInfo,
        contractAddress: process.env.CONTRACT_ADDRESS,
        explorerUrl: process.env.BLOCKCHAIN_EXPLORER_URL
      }
    });

  } catch (error) {
    console.error('Error fetching blockchain stats:', error);
    res.status(500).json({
      error: 'Failed to fetch blockchain statistics',
      message: error.message
    });
  }
});

// POST /api/blockchain/estimate-gas - Estimate gas for idea registration
router.post('/estimate-gas', [
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('descriptionHash').isLength({ min: 1 }).withMessage('Description hash is required'),
  body('isPrivate').isBoolean().withMessage('isPrivate must be boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    // This would require implementing gas estimation in blockchainService
    // For now, return estimated values
    const gasPrice = await blockchainService.getGasPrice();
    
    res.json({
      success: true,
      data: {
        estimatedGas: '150000', // Estimated gas units
        gasPrice: gasPrice,
        estimatedCost: '0.01', // Estimated cost in ETH
        currency: 'MATIC' // or ETH depending on network
      }
    });

  } catch (error) {
    console.error('Error estimating gas:', error);
    res.status(500).json({
      error: 'Failed to estimate gas',
      message: error.message
    });
  }
});

module.exports = router;
