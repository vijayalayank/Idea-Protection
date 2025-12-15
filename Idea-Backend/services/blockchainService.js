const { ethers } = require('ethers');
const contractABI = require('../contracts/IdeaRegistry.json');

class BlockchainService {
  constructor() {
    this.provider = null;
    this.contract = null;
    this.signer = null;
    this.connected = false;
  }

  async initialize() {
    try {
      // Connect to blockchain network
      const rpcUrl = process.env.RPC_URL || 'https://polygon-mumbai.g.alchemy.com/v2/your-api-key';
      this.provider = new ethers.JsonRpcProvider(rpcUrl);

      // Setup signer (for contract interactions)
      if (process.env.PRIVATE_KEY) {
        this.signer = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
      }

      // Initialize contract
      const contractAddress = process.env.CONTRACT_ADDRESS;
      if (contractAddress && contractABI.abi) {
        this.contract = new ethers.Contract(
          contractAddress,
          contractABI.abi,
          this.signer || this.provider
        );
      }

      // Test connection
      await this.provider.getNetwork();
      this.connected = true;

      console.log('✅ Blockchain service initialized');
      console.log(`📡 Network: ${(await this.provider.getNetwork()).name}`);
      console.log(`📄 Contract: ${contractAddress}`);

    } catch (error) {
      console.error('❌ Blockchain initialization failed:', error.message);
      this.connected = false;
    }
  }

  isConnected() {
    return this.connected;
  }

  async registerIdea(ideaData) {
    if (!this.contract || !this.signer) {
      throw new Error('Blockchain service not properly initialized');
    }

    try {
      const {
        title,
        descriptionHash,
        fileHash,
        isPrivate,
        passwordHash
      } = ideaData;

      // Estimate gas
      const gasEstimate = await this.contract.registerIdea.estimateGas(
        title,
        descriptionHash,
        fileHash || '',
        isPrivate,
        passwordHash || ''
      );

      // Add 20% buffer to gas estimate
      const gasLimit = gasEstimate * 120n / 100n;

      // Execute transaction
      const tx = await this.contract.registerIdea(
        title,
        descriptionHash,
        fileHash || '',
        isPrivate,
        passwordHash || '',
        { gasLimit }
      );

      console.log(`📝 Idea registration transaction: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait();

      // Extract idea ID from event logs
      const event = receipt.logs.find(log => {
        try {
          const parsed = this.contract.interface.parseLog(log);
          return parsed.name === 'IdeaRegistered';
        } catch {
          return false;
        }
      });

      let ideaId = null;
      if (event) {
        const parsed = this.contract.interface.parseLog(event);
        ideaId = parsed.args.ideaId.toString();
      }

      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        ideaId,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Blockchain registration error:', error);
      throw new Error(`Blockchain registration failed: ${error.message}`);
    }
  }

  async getPublicIdeas(offset = 0, limit = 10) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const ideas = await this.contract.getPublicIdeas(offset, limit);

      return ideas.map(idea => ({
        id: idea.id.toString(),
        owner: idea.owner,
        title: idea.title,
        descriptionHash: idea.descriptionHash,
        fileHash: idea.fileHash,
        timestamp: new Date(Number(idea.timestamp) * 1000).toISOString()
      }));

    } catch (error) {
      console.error('Error fetching public ideas:', error);
      throw new Error(`Failed to fetch ideas: ${error.message}`);
    }
  }

  async getUserIdeas(userAddress) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      // This would require the user to sign a message or connect their wallet
      // For now, we'll return empty array and handle this on frontend
      return [];
    } catch (error) {
      console.error('Error fetching user ideas:', error);
      throw new Error(`Failed to fetch user ideas: ${error.message}`);
    }
  }

  async getIdeaDetails(ideaId, password = '') {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const idea = await this.contract.getIdeaDetails(ideaId, password);

      return {
        id: idea.id.toString(),
        owner: idea.owner,
        title: idea.title,
        descriptionHash: idea.descriptionHash,
        fileHash: idea.fileHash,
        timestamp: new Date(Number(idea.timestamp) * 1000).toISOString(),
        isPrivate: idea.isPrivate
      };

    } catch (error) {
      console.error('Error fetching idea details:', error);
      throw new Error(`Failed to fetch idea details: ${error.message}`);
    }
  }

  async verifyOwnership(ideaId, ownerAddress) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      return await this.contract.verifyIdeaOwnership(ideaId, ownerAddress);
    } catch (error) {
      console.error('Error verifying ownership:', error);
      return false;
    }
  }

  async getTotalPublicIdeas() {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const total = await this.contract.getTotalPublicIdeas();
      return total.toString();
    } catch (error) {
      console.error('Error getting total ideas:', error);
      return '0';
    }
  }

  // Utility methods
  async getGasPrice() {
    if (!this.provider) return null;

    try {
      const gasPrice = await this.provider.getFeeData();
      return {
        gasPrice: gasPrice.gasPrice?.toString(),
        maxFeePerGas: gasPrice.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas?.toString()
      };
    } catch (error) {
      console.error('Error getting gas price:', error);
      return null;
    }
  }

  async getNetworkInfo() {
    if (!this.provider) return null;

    try {
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();

      return {
        chainId: network.chainId.toString(),
        name: network.name,
        blockNumber,
        ensAddress: network.ensAddress
      };
    } catch (error) {
      console.error('Error getting network info:', error);
      return null;
    }
  }
}

module.exports = new BlockchainService();
