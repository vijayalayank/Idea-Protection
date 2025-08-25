const mongoose = require('mongoose');

const ideaSchema = new mongoose.Schema({
  // Blockchain data
  blockchainId: {
    type: String,
    unique: true,
    sparse: true // Allows null values but ensures uniqueness when present
  },
  transactionHash: {
    type: String,
    unique: true,
    sparse: true
  },
  blockNumber: {
    type: Number
  },
  
  // Idea content
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 5000
  },
  
  // IPFS hashes
  descriptionHash: {
    type: String,
    required: true,
    unique: true
  },
  fileHash: {
    type: String,
    sparse: true
  },
  
  // Owner information
  ownerAddress: {
    type: String,
    required: true,
    lowercase: true,
    match: /^0x[a-fA-F0-9]{40}$/
  },
  
  // Privacy settings
  isPrivate: {
    type: Boolean,
    default: false
  },
  passwordHash: {
    type: String,
    select: false // Don't include in queries by default
  },
  
  // File information
  supportingFiles: [{
    filename: String,
    originalName: String,
    ipfsHash: String,
    size: Number,
    mimeType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed'],
    default: 'pending'
  },
  
  // Metadata
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  category: {
    type: String,
    enum: ['technology', 'business', 'creative', 'scientific', 'other'],
    default: 'other'
  },
  
  // Analytics
  viewCount: {
    type: Number,
    default: 0
  },
  lastViewed: {
    type: Date
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  blockchainTimestamp: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
ideaSchema.index({ ownerAddress: 1, createdAt: -1 });
ideaSchema.index({ isPrivate: 1, createdAt: -1 });
ideaSchema.index({ status: 1 });
ideaSchema.index({ descriptionHash: 1 });
ideaSchema.index({ blockchainId: 1 });
ideaSchema.index({ tags: 1 });
ideaSchema.index({ category: 1 });

// Text search index
ideaSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text'
});

// Virtual for formatted creation date
ideaSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Virtual for blockchain explorer URL
ideaSchema.virtual('explorerUrl').get(function() {
  if (!this.transactionHash) return null;
  
  const baseUrl = process.env.BLOCKCHAIN_EXPLORER_URL || 'https://mumbai.polygonscan.com';
  return `${baseUrl}/tx/${this.transactionHash}`;
});

// Pre-save middleware
ideaSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Instance methods
ideaSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  this.lastViewed = new Date();
  return this.save();
};

ideaSchema.methods.updateBlockchainData = function(blockchainData) {
  this.blockchainId = blockchainData.ideaId;
  this.transactionHash = blockchainData.transactionHash;
  this.blockNumber = blockchainData.blockNumber;
  this.blockchainTimestamp = new Date(blockchainData.timestamp);
  this.status = 'confirmed';
  return this.save();
};

ideaSchema.methods.markAsFailed = function(error) {
  this.status = 'failed';
  this.error = error;
  return this.save();
};

// Static methods
ideaSchema.statics.findPublicIdeas = function(options = {}) {
  const {
    page = 1,
    limit = 10,
    category,
    tags,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;

  const query = { isPrivate: false, status: 'confirmed' };
  
  if (category) {
    query.category = category;
  }
  
  if (tags && tags.length > 0) {
    query.tags = { $in: tags };
  }
  
  if (search) {
    query.$text = { $search: search };
  }

  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  return this.find(query)
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .select('-passwordHash')
    .exec();
};

ideaSchema.statics.findByOwner = function(ownerAddress, includePrivate = true) {
  const query = { ownerAddress: ownerAddress.toLowerCase() };
  
  if (!includePrivate) {
    query.isPrivate = false;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .select('-passwordHash')
    .exec();
};

ideaSchema.statics.getStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalIdeas: { $sum: 1 },
        publicIdeas: {
          $sum: { $cond: [{ $eq: ['$isPrivate', false] }, 1, 0] }
        },
        privateIdeas: {
          $sum: { $cond: [{ $eq: ['$isPrivate', true] }, 1, 0] }
        },
        confirmedIdeas: {
          $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
        },
        pendingIdeas: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Idea', ideaSchema);
