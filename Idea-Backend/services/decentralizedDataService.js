const blockchainService = require('./blockchainService');
const ipfsService = require('./ipfsService');

class DecentralizedDataService {
  constructor() {
    this.cache = new Map(); // In-memory cache for performance
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Register idea completely on IPFS + Blockchain
  async registerIdea(ideaData) {
    try {
      const {
        title,
        description,
        ownerAddress,
        isPrivate = false,
        password,
        category = 'other',
        tags = [],
        supportingFiles = [],
        userAgent,
        ipAddress,
        browserFingerprint
      } = ideaData;

      // 1. Upload all supporting files to IPFS first
      const uploadedFiles = [];
      for (const file of supportingFiles) {
        const fileUpload = await ipfsService.uploadFile(
          file.buffer,
          file.originalname,
          {
            name: `${title}-${file.originalname}`,
            keyvalues: {
              ideaTitle: title,
              fileType: 'supporting-document',
              owner: ownerAddress
            }
          }
        );

        uploadedFiles.push({
          filename: file.originalname,
          ipfsHash: fileUpload.hash,
          size: file.size,
          mimeType: file.mimetype,
          url: fileUpload.url
        });
      }

      // 2. Create complete idea data object
      const completeIdeaData = {
        title,
        description,
        category,
        tags,
        owner: ownerAddress,
        ownerAddress,
        supportingFiles: uploadedFiles,
        isPrivate,
        userAgent,
        ipAddress,
        browserFingerprint
      };

      // 3. Upload complete idea data to IPFS
      const metadataUpload = await ipfsService.uploadCompleteIdeaData(completeIdeaData);

      let accessHash = '';

      // 4. For private ideas, create encrypted access data
      if (isPrivate && password) {
        const privateAccessData = {
          metadataHash: metadataUpload.hash,
          title,
          description: description.substring(0, 100) + '...', // Preview only
          owner: ownerAddress,
          timestamp: new Date().toISOString()
        };

        const accessUpload = await ipfsService.uploadPrivateAccessData(privateAccessData, password);
        accessHash = accessUpload.hash;
      }

      // 5. Register on blockchain (only hashes)
      const blockchainResult = await blockchainService.registerIdea({
        metadataHash: metadataUpload.hash,
        isPrivate,
        accessHash
      });

      // 6. Cache the result
      const cacheKey = `idea_${blockchainResult.ideaId}`;
      this.cache.set(cacheKey, {
        data: {
          id: blockchainResult.ideaId,
          metadataHash: metadataUpload.hash,
          accessHash,
          isPrivate,
          owner: ownerAddress,
          timestamp: new Date().toISOString(),
          transactionHash: blockchainResult.transactionHash,
          blockNumber: blockchainResult.blockNumber
        },
        cachedAt: Date.now()
      });

      return {
        success: true,
        ideaId: blockchainResult.ideaId,
        metadataHash: metadataUpload.hash,
        accessHash,
        transactionHash: blockchainResult.transactionHash,
        blockNumber: blockchainResult.blockNumber,
        ipfsUrl: metadataUpload.url,
        explorerUrl: `${process.env.BLOCKCHAIN_EXPLORER_URL}/tx/${blockchainResult.transactionHash}`
      };

    } catch (error) {
      console.error('Decentralized idea registration failed:', error);
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  // Get public ideas from blockchain + IPFS
  async getPublicIdeas(offset = 0, limit = 10) {
    try {
      // 1. Get idea hashes from blockchain
      const blockchainIdeas = await blockchainService.getPublicIdeas(offset, limit);

      // 2. Fetch metadata from IPFS for each idea
      const ideasWithMetadata = await Promise.all(
        blockchainIdeas.map(async (idea) => {
          try {
            // Check cache first
            const cacheKey = `metadata_${idea.metadataHash}`;
            let metadata = this.getCachedData(cacheKey);

            if (!metadata) {
              // Fetch from IPFS
              metadata = await ipfsService.getContent(idea.metadataHash);

              // Cache the metadata
              this.cache.set(cacheKey, {
                data: metadata,
                cachedAt: Date.now()
              });
            }

            return {
              id: idea.id,
              owner: idea.owner,
              timestamp: idea.timestamp,
              metadataHash: idea.metadataHash,
              // Include actual data from IPFS
              title: metadata.title,
              description: metadata.description,
              category: metadata.category,
              tags: metadata.tags,
              supportingFiles: metadata.supportingFiles || [],
              contentHash: metadata.contentHash,
              createdAt: metadata.timestamp
            };

          } catch (error) {
            console.error(`Failed to fetch metadata for idea ${idea.id}:`, error);
            // Return basic info if IPFS fetch fails
            return {
              id: idea.id,
              owner: idea.owner,
              timestamp: idea.timestamp,
              metadataHash: idea.metadataHash,
              title: 'Content unavailable',
              description: 'Unable to load content from IPFS',
              error: 'IPFS_FETCH_FAILED'
            };
          }
        })
      );

      return ideasWithMetadata;

    } catch (error) {
      console.error('Error fetching public ideas:', error);
      throw new Error(`Failed to fetch ideas: ${error.message}`);
    }
  }

  // Get specific idea details
  async getIdeaDetails(ideaId, password = null) {
    try {
      // 1. Get basic info from blockchain
      const blockchainIdea = await blockchainService.getIdeaDetails(ideaId);

      if (!blockchainIdea.exists) {
        throw new Error('Idea not found');
      }

      // 2. Handle private ideas
      if (blockchainIdea.isPrivate) {
        if (!password && blockchainIdea.owner !== 'current_user') { // You'd need to implement user auth
          // Return limited info for private ideas
          return {
            id: blockchainIdea.id,
            owner: blockchainIdea.owner,
            timestamp: blockchainIdea.timestamp,
            isPrivate: true,
            title: 'Private Idea',
            description: 'This idea is private. Please provide the password to access.',
            accessRequired: true
          };
        }

        if (password && blockchainIdea.accessHash) {
          try {
            // Get encrypted access data
            const encryptedData = await ipfsService.getContent(blockchainIdea.accessHash);
            const decryptedAccess = ipfsService.decryptData(encryptedData.encryptedMetadata, password);

            // Get full metadata using decrypted hash
            const metadata = await ipfsService.getContent(decryptedAccess.metadataHash);

            return {
              id: blockchainIdea.id,
              owner: blockchainIdea.owner,
              timestamp: blockchainIdea.timestamp,
              isPrivate: true,
              ...metadata,
              accessGranted: true
            };

          } catch (error) {
            throw new Error('Invalid password');
          }
        }
      }

      // 3. For public ideas, get metadata directly
      if (blockchainIdea.metadataHash) {
        const metadata = await ipfsService.getContent(blockchainIdea.metadataHash);

        return {
          id: blockchainIdea.id,
          owner: blockchainIdea.owner,
          timestamp: blockchainIdea.timestamp,
          isPrivate: false,
          metadataHash: blockchainIdea.metadataHash,
          ...metadata
        };
      }

      throw new Error('Idea metadata not available');

    } catch (error) {
      console.error('Error fetching idea details:', error);
      throw new Error(`Failed to fetch idea details: ${error.message}`);
    }
  }

  // Search ideas (limited to cached/indexed data)
  async searchIdeas(query, filters = {}) {
    try {
      // For a fully decentralized approach, we'd need to:
      // 1. Get all public ideas
      // 2. Filter client-side
      // This is not efficient for large datasets, but maintains decentralization

      const allIdeas = await this.getPublicIdeas(0, 100); // Get more for search

      const filteredIdeas = allIdeas.filter(idea => {
        // Text search
        if (query) {
          const searchText = `${idea.title} ${idea.description} ${idea.tags?.join(' ')}`.toLowerCase();
          if (!searchText.includes(query.toLowerCase())) {
            return false;
          }
        }

        // Category filter
        if (filters.category && idea.category !== filters.category) {
          return false;
        }

        // Tags filter
        if (filters.tags && filters.tags.length > 0) {
          const ideaTags = idea.tags || [];
          if (!filters.tags.some(tag => ideaTags.includes(tag))) {
            return false;
          }
        }

        return true;
      });

      return filteredIdeas;

    } catch (error) {
      console.error('Search error:', error);
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  // Utility methods
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.cachedAt) < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  clearCache() {
    this.cache.clear();
  }

  // Get platform statistics
  async getStats() {
    try {
      const totalPublicIdeas = await blockchainService.getTotalPublicIdeas();
      const networkInfo = await blockchainService.getNetworkInfo();

      return {
        totalPublicIdeas: parseInt(totalPublicIdeas),
        network: networkInfo,
        ipfsConnected: ipfsService.isConnected(),
        blockchainConnected: blockchainService.isConnected(),
        cacheSize: this.cache.size
      };

    } catch (error) {
      console.error('Error fetching stats:', error);
      throw new Error(`Failed to fetch statistics: ${error.message}`);
    }
  }
}

module.exports = new DecentralizedDataService();
