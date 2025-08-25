class MockBlockchainService {
  constructor() {
    this.ideas = new Map();
    this.nextId = 1;
    this.connected = true;
  }

  async initialize() {
    console.log('✅ Mock Blockchain service initialized (for development)');
    console.log('📡 Network: Mock Testnet');
    console.log('📄 Contract: 0xMockContract...');
  }

  isConnected() {
    return this.connected;
  }

  async registerIdea(ideaData) {
    try {
      const ideaId = this.nextId++;
      const transactionHash = `0x${Math.random().toString(16).substring(2, 66)}`;
      const blockNumber = Math.floor(Math.random() * 1000000) + 1000000;

      // Store idea data
      this.ideas.set(ideaId, {
        id: ideaId,
        owner: '0x' + Math.random().toString(16).substring(2, 42), // Mock owner
        metadataHash: ideaData.metadataHash,
        timestamp: Math.floor(Date.now() / 1000),
        isPrivate: ideaData.isPrivate,
        accessHash: ideaData.accessHash,
        exists: true,
        transactionHash,
        blockNumber
      });

      // Simulate blockchain delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      return {
        success: true,
        transactionHash,
        blockNumber,
        gasUsed: '150000',
        ideaId: ideaId.toString(),
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Mock blockchain registration error:', error);
      throw new Error(`Mock blockchain registration failed: ${error.message}`);
    }
  }

  async getPublicIdeas(offset = 0, limit = 10) {
    try {
      const publicIdeas = [];
      
      for (const [id, idea] of this.ideas.entries()) {
        if (!idea.isPrivate) {
          publicIdeas.push({
            id: idea.id.toString(),
            owner: idea.owner,
            metadataHash: idea.metadataHash,
            timestamp: new Date(idea.timestamp * 1000).toISOString()
          });
        }
      }

      // Apply pagination
      const paginatedIdeas = publicIdeas.slice(offset, offset + limit);
      
      return paginatedIdeas;

    } catch (error) {
      console.error('Error fetching mock public ideas:', error);
      throw new Error(`Failed to fetch ideas: ${error.message}`);
    }
  }

  async getIdeaDetails(ideaId) {
    try {
      const idea = this.ideas.get(parseInt(ideaId));
      
      if (!idea) {
        throw new Error('Idea not found');
      }

      return {
        id: idea.id.toString(),
        owner: idea.owner,
        metadataHash: idea.metadataHash,
        timestamp: new Date(idea.timestamp * 1000).toISOString(),
        isPrivate: idea.isPrivate,
        accessHash: idea.accessHash,
        exists: true
      };

    } catch (error) {
      console.error('Error fetching mock idea details:', error);
      throw new Error(`Failed to fetch idea details: ${error.message}`);
    }
  }

  async verifyOwnership(ideaId, ownerAddress) {
    try {
      const idea = this.ideas.get(parseInt(ideaId));
      return idea ? idea.owner.toLowerCase() === ownerAddress.toLowerCase() : false;
    } catch (error) {
      console.error('Error verifying mock ownership:', error);
      return false;
    }
  }

  async getTotalPublicIdeas() {
    try {
      let count = 0;
      for (const [id, idea] of this.ideas.entries()) {
        if (!idea.isPrivate) {
          count++;
        }
      }
      return count.toString();
    } catch (error) {
      console.error('Error getting total mock ideas:', error);
      return '0';
    }
  }

  async getGasPrice() {
    return {
      gasPrice: '20000000000', // 20 gwei
      maxFeePerGas: '30000000000',
      maxPriorityFeePerGas: '2000000000'
    };
  }

  async getNetworkInfo() {
    return {
      chainId: '80001', // Mumbai testnet
      name: 'Mock Testnet',
      blockNumber: Math.floor(Math.random() * 1000000) + 30000000,
      ensAddress: null
    };
  }
}

module.exports = new MockBlockchainService();
