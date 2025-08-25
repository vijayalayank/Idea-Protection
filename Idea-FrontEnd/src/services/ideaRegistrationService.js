import blockchainService from './blockchainService.js';
import ipfsService from './ipfsService.js';

class IdeaRegistrationService {
  constructor() {
    this.isInitialized = false;
  }

  // Initialize services
  async initialize(walletProvider) {
    try {
      console.log('🚀 Initializing Idea Registration Service...');

      // Initialize blockchain service
      await blockchainService.initialize(walletProvider);

      // Test IPFS connection
      const ipfsStatus = await ipfsService.testConnection();
      if (ipfsStatus.status !== 'connected') {
        throw new Error(`IPFS service error: ${ipfsStatus.error}`);
      }

      this.isInitialized = true;
      console.log('✅ Idea Registration Service initialized successfully');

      return true;

    } catch (error) {
      console.error('❌ Service initialization failed:', error);
      throw error;
    }
  }

  // Complete idea registration process
  async registerIdea(ideaData, files = []) {
    if (!this.isInitialized) {
      throw new Error('Service not initialized. Please connect your wallet first.');
    }

    try {
      console.log('📝 Starting complete idea registration...');
      console.log('📄 Title:', ideaData.title);
      console.log('🔒 Private:', ideaData.isPrivate);
      console.log('📁 Files:', files.length);

      // Step 1: Upload supporting files to IPFS
      const uploadedFiles = [];
      if (files && files.length > 0) {
        console.log('📤 Uploading supporting files...');
        
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          console.log(`📁 Uploading file ${i + 1}/${files.length}: ${file.name}`);
          
          const fileUpload = await ipfsService.uploadFile(file, {
            name: `${ideaData.title}-${file.name}`,
            keyvalues: {
              ideaTitle: ideaData.title,
              fileType: 'supporting-document',
              owner: ideaData.ownerAddress
            }
          });

          uploadedFiles.push({
            filename: file.name,
            ipfsHash: fileUpload.hash,
            size: file.size,
            mimetype: file.type,
            url: fileUpload.url
          });
        }
        
        console.log(`✅ ${uploadedFiles.length} files uploaded to IPFS`);
      }

      // Step 2: Create complete idea metadata
      const completeIdeaData = {
        title: ideaData.title,
        description: ideaData.description,
        category: ideaData.category || 'other',
        tags: ideaData.tags || [],
        owner: ideaData.ownerAddress,
        ownerAddress: ideaData.ownerAddress,
        supportingFiles: uploadedFiles,
        isPrivate: ideaData.isPrivate || false
      };

      // Step 3: Upload complete metadata to IPFS
      console.log('📤 Uploading idea metadata to IPFS...');
      const metadataUpload = await ipfsService.uploadCompleteIdeaData(completeIdeaData);
      console.log('✅ Metadata uploaded:', metadataUpload.hash);

      let accessHash = '';

      // Step 4: Handle private ideas
      if (ideaData.isPrivate && ideaData.password) {
        console.log('🔒 Creating private access data...');
        
        const privateAccessData = {
          metadataHash: metadataUpload.hash,
          title: ideaData.title,
          description: ideaData.description.substring(0, 100) + '...', // Preview only
          owner: ideaData.ownerAddress,
          timestamp: new Date().toISOString()
        };

        const accessUpload = await ipfsService.uploadPrivateAccessData(
          privateAccessData, 
          ideaData.password
        );
        
        accessHash = accessUpload.hash;
        console.log('✅ Private access data created:', accessHash);
      }

      // Step 5: Register on blockchain
      console.log('⛓️ Registering on blockchain...');
      const blockchainResult = await blockchainService.registerIdea(
        metadataUpload.hash,
        ideaData.isPrivate || false,
        accessHash
      );

      console.log('✅ Blockchain registration successful!');

      // Step 6: Return complete result
      const result = {
        success: true,
        ideaId: blockchainResult.ideaId,
        transactionHash: blockchainResult.transactionHash,
        blockNumber: blockchainResult.blockNumber,
        gasUsed: blockchainResult.gasUsed,
        
        // IPFS data
        metadataHash: metadataUpload.hash,
        metadataUrl: metadataUpload.url,
        accessHash,
        supportingFiles: uploadedFiles,
        
        // URLs
        explorerUrl: this.getExplorerUrl(blockchainResult.transactionHash),
        ipfsUrl: metadataUpload.url,
        
        // Timestamps
        timestamp: blockchainResult.timestamp
      };

      console.log('🎉 Complete idea registration finished!');
      return result;

    } catch (error) {
      console.error('❌ Idea registration failed:', error);
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  // Get public ideas with full metadata
  async getPublicIdeas(offset = 0, limit = 10) {
    if (!this.isInitialized) {
      throw new Error('Service not initialized');
    }

    try {
      console.log(`📖 Fetching public ideas (${offset}-${offset + limit})...`);

      // Step 1: Get idea hashes from blockchain
      const blockchainIdeas = await blockchainService.getPublicIdeas(offset, limit);
      console.log(`📄 Found ${blockchainIdeas.length} ideas on blockchain`);

      // Step 2: Fetch metadata from IPFS for each idea
      const ideasWithMetadata = await Promise.all(
        blockchainIdeas.map(async (idea) => {
          try {
            console.log(`📥 Fetching metadata for idea ${idea.id}...`);
            
            // Get metadata from IPFS
            const metadata = await ipfsService.getContent(idea.metadataHash);
            
            return {
              // Blockchain data
              id: idea.id,
              owner: idea.owner,
              timestamp: idea.timestamp,
              metadataHash: idea.metadataHash,
              
              // IPFS metadata
              title: metadata.title,
              description: metadata.description,
              category: metadata.category,
              tags: metadata.tags || [],
              supportingFiles: metadata.supportingFiles || [],
              contentHash: metadata.contentHash,
              createdAt: metadata.timestamp,
              
              // URLs
              explorerUrl: this.getExplorerUrl(idea.transactionHash),
              ipfsUrl: `${ipfsService.gateway}${idea.metadataHash}`
            };

          } catch (error) {
            console.error(`❌ Failed to fetch metadata for idea ${idea.id}:`, error);
            
            // Return basic info if IPFS fetch fails
            return {
              id: idea.id,
              owner: idea.owner,
              timestamp: idea.timestamp,
              metadataHash: idea.metadataHash,
              title: 'Content unavailable',
              description: 'Unable to load content from IPFS',
              error: 'IPFS_FETCH_FAILED',
              explorerUrl: this.getExplorerUrl(idea.transactionHash)
            };
          }
        })
      );

      console.log(`✅ Retrieved ${ideasWithMetadata.length} ideas with metadata`);
      return ideasWithMetadata;

    } catch (error) {
      console.error('❌ Error fetching public ideas:', error);
      throw new Error(`Failed to fetch ideas: ${error.message}`);
    }
  }

  // Get specific idea details
  async getIdeaDetails(ideaId, password = null) {
    if (!this.isInitialized) {
      throw new Error('Service not initialized');
    }

    try {
      console.log(`📖 Fetching details for idea ${ideaId}...`);

      // Step 1: Get basic info from blockchain
      const blockchainIdea = await blockchainService.getIdeaDetails(ideaId);

      if (!blockchainIdea.exists) {
        throw new Error('Idea not found');
      }

      // Step 2: Handle private ideas
      if (blockchainIdea.isPrivate) {
        const currentUser = await blockchainService.getCurrentUser();
        
        if (!password && blockchainIdea.owner.toLowerCase() !== currentUser?.toLowerCase()) {
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
            const decryptedAccess = await ipfsService.decryptData(
              encryptedData.encryptedMetadata, 
              password
            );
            
            // Get full metadata using decrypted hash
            const metadata = await ipfsService.getContent(decryptedAccess.metadataHash);
            
            return {
              id: blockchainIdea.id,
              owner: blockchainIdea.owner,
              timestamp: blockchainIdea.timestamp,
              isPrivate: true,
              ...metadata,
              accessGranted: true,
              explorerUrl: this.getExplorerUrl(blockchainIdea.transactionHash)
            };

          } catch (error) {
            throw new Error('Invalid password');
          }
        }
      }

      // Step 3: For public ideas, get metadata directly
      if (blockchainIdea.metadataHash) {
        const metadata = await ipfsService.getContent(blockchainIdea.metadataHash);
        
        return {
          id: blockchainIdea.id,
          owner: blockchainIdea.owner,
          timestamp: blockchainIdea.timestamp,
          isPrivate: false,
          metadataHash: blockchainIdea.metadataHash,
          ...metadata,
          explorerUrl: this.getExplorerUrl(blockchainIdea.transactionHash),
          ipfsUrl: `${ipfsService.gateway}${blockchainIdea.metadataHash}`
        };
      }

      throw new Error('Idea metadata not available');

    } catch (error) {
      console.error('❌ Error fetching idea details:', error);
      throw new Error(`Failed to fetch idea details: ${error.message}`);
    }
  }

  // Get user's ideas
  async getUserIdeas() {
    if (!this.isInitialized) {
      throw new Error('Service not initialized');
    }

    try {
      const currentUser = await blockchainService.getCurrentUser();
      if (!currentUser) {
        throw new Error('No user connected');
      }

      const ideaIds = await blockchainService.getUserIdeas(currentUser);
      
      // Get details for each idea
      const userIdeas = await Promise.all(
        ideaIds.map(id => this.getIdeaDetails(id))
      );

      return userIdeas;

    } catch (error) {
      console.error('❌ Error fetching user ideas:', error);
      throw new Error(`Failed to fetch user ideas: ${error.message}`);
    }
  }

  // Estimate registration cost
  async estimateRegistrationCost(ideaData) {
    if (!this.isInitialized) {
      throw new Error('Service not initialized');
    }

    try {
      // Estimate blockchain gas cost
      const gasEstimate = await blockchainService.estimateRegistrationGas(
        'QmTempHashForEstimation', // Temporary hash for estimation
        ideaData.isPrivate || false,
        ideaData.isPrivate ? 'QmTempAccessHash' : ''
      );

      return {
        blockchain: {
          gasLimit: gasEstimate.gasLimit,
          gasPrice: gasEstimate.gasPrice,
          estimatedCost: gasEstimate.estimatedCost,
          currency: gasEstimate.currency
        },
        ipfs: {
          cost: '0.00', // IPFS storage is typically free with Pinata
          currency: 'USD'
        },
        total: {
          cost: gasEstimate.estimatedCost,
          currency: gasEstimate.currency
        }
      };

    } catch (error) {
      console.error('❌ Error estimating cost:', error);
      throw new Error(`Cost estimation failed: ${error.message}`);
    }
  }

  // Get platform statistics
  async getStats() {
    try {
      const totalPublicIdeas = await blockchainService.getTotalPublicIdeas();
      const networkInfo = await blockchainService.getNetworkInfo();
      const ipfsStatus = await ipfsService.testConnection();

      return {
        totalPublicIdeas: parseInt(totalPublicIdeas),
        network: networkInfo,
        services: {
          blockchain: blockchainService.isReady(),
          ipfs: ipfsStatus.status === 'connected'
        },
        contractAddress: blockchainService.getContractAddress()
      };

    } catch (error) {
      console.error('❌ Error fetching stats:', error);
      throw new Error(`Failed to fetch statistics: ${error.message}`);
    }
  }

  // Helper method to get explorer URL
  getExplorerUrl(transactionHash) {
    const chainId = parseInt(import.meta.env.VITE_CHAIN_ID || '80001');
    
    const explorers = {
      1: 'https://etherscan.io',
      137: 'https://polygonscan.com',
      80001: 'https://mumbai.polygonscan.com',
      11155111: 'https://sepolia.etherscan.io'
    };

    const baseUrl = explorers[chainId] || 'https://mumbai.polygonscan.com';
    return `${baseUrl}/tx/${transactionHash}`;
  }

  // Check if service is ready
  isReady() {
    return this.isInitialized && blockchainService.isReady() && ipfsService.isConfigured();
  }
}

// Export singleton instance
export default new IdeaRegistrationService();
