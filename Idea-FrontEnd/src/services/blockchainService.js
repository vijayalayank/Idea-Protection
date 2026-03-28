import { ethers } from 'ethers';
import IdeaRegistryABI from '../contracts/IdeaRegistry.json';

class BlockchainService {
  constructor() {
    this.provider = null;
    this.contract = null;
    this.signer = null;
    this.chainId = parseInt(import.meta.env.VITE_CHAIN_ID || '80001'); // Default to Amoy/Mumbai

    // Get contract address from env or from ABI networks
    this.contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
    if (!this.contractAddress && IdeaRegistryABI.networks && IdeaRegistryABI.networks[this.chainId]) {
      this.contractAddress = IdeaRegistryABI.networks[this.chainId].address;
    }

    this.isContractDeployed = false;
  }

  // Initialize with user's wallet
  async initialize(walletProvider) {
    try {
      if (!walletProvider) {
        throw new Error('Wallet provider required');
      }

      // Create ethers provider from wallet
      this.provider = new ethers.BrowserProvider(walletProvider);
      this.signer = await this.provider.getSigner();

      // Initialize contract (if deployed)
      if (this.contractAddress && this.contractAddress !== '0x...' && IdeaRegistryABI.abi) {
        this.contract = new ethers.Contract(
          this.contractAddress,
          IdeaRegistryABI.abi,
          this.signer
        );
        this.isContractDeployed = true;
        console.log('📄 Contract initialized:', this.contractAddress);
      } else {
        console.log('⚠️ Contract not deployed yet - IPFS-only mode');
        this.isContractDeployed = false;
      }

      // Verify network
      const network = await this.provider.getNetwork();
      if (Number(network.chainId) !== this.chainId) {
        throw new Error(`Please switch to the correct network (Chain ID: ${this.chainId})`);
      }

      console.log('✅ Blockchain service initialized');
      console.log(`📡 Network: ${network.name} (${network.chainId})`);
      console.log(`📄 Contract: ${this.contractAddress}`);

      return true;

    } catch (error) {
      console.error('❌ Blockchain initialization failed:', error);
      throw error;
    }
  }

  // Register idea on blockchain
  async registerIdea(metadataHash, isPrivate = false, accessHash = '') {
    if (!this.signer) {
      throw new Error('Blockchain service not initialized');
    }

    // Handle IPFS-only mode when contract is not deployed
    if (!this.isContractDeployed || !this.contract) {
      console.log('📝 IPFS-only mode: Simulating blockchain registration...');
      const mockIdeaId = Date.now().toString();

      return {
        success: true,
        ideaId: mockIdeaId,
        transactionHash: `mock-tx-${mockIdeaId}`,
        blockNumber: 0,
        gasUsed: '0',
        timestamp: new Date().toISOString(),
        mode: 'ipfs-only'
      };
    }

    try {
      console.log('📝 Registering idea on blockchain...');
      console.log('📄 Metadata hash:', metadataHash);
      console.log('🔒 Private:', isPrivate);

      // Estimate gas
      const gasEstimate = await this.contract.registerIdea.estimateGas(
        metadataHash,
        isPrivate,
        accessHash
      );

      console.log('⛽ Estimated gas:', gasEstimate.toString());

      // Add 20% buffer to gas estimate
      const gasLimit = gasEstimate * 120n / 100n;

      // Amoy network typically requires higher gas fees
      // Minimum tip cap is usually around 25 Gwei (25000000000 wei)
      const MIN_PRIORITY_FEE = 25000000000n; // 25 Gwei

      let feeData;
      try {
        feeData = await this.provider.getFeeData();
      } catch (e) {
        console.warn('Could not fetch fee data, using defaults');
      }

      // Calculate safe fees
      // Use the higher of network suggestion or our minimum
      const maxPriorityFeePerGas = feeData?.maxPriorityFeePerGas && feeData.maxPriorityFeePerGas > MIN_PRIORITY_FEE
        ? feeData.maxPriorityFeePerGas
        : MIN_PRIORITY_FEE;

      // Ensure maxFee is at least priority fee + base fee (we add a buffer to base fee)
      let maxFeePerGas;
      if (feeData?.maxFeePerGas) {
        // Use network suggestion if it's safe (higher than our calc priority fee)
        maxFeePerGas = feeData.maxFeePerGas < maxPriorityFeePerGas
          ? maxPriorityFeePerGas + 1000000000n // +1 Gwei if network max is weirdly low
          : feeData.maxFeePerGas;
      } else {
        // Only use fixed buffer if we can't get network data
        maxFeePerGas = maxPriorityFeePerGas + 5000000000n; // 5 Gwei buffer
      }

      console.log(`⛽ Using fees - Priority: ${ethers.formatUnits(maxPriorityFeePerGas, 'gwei')} Gwei, Max: ${ethers.formatUnits(maxFeePerGas, 'gwei')} Gwei`);

      // Execute transaction
      const tx = await this.contract.registerIdea(
        metadataHash,
        isPrivate,
        accessHash,
        {
          gasLimit,
          maxPriorityFeePerGas,
          maxFeePerGas
        }
      );

      console.log('⏳ Transaction submitted:', tx.hash);
      console.log('🔗 Waiting for confirmation...');

      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed in block:', receipt.blockNumber);

      // Extract idea ID from event logs
      let ideaId = null;
      for (const log of receipt.logs) {
        try {
          const parsed = this.contract.interface.parseLog(log);
          if (parsed.name === 'IdeaRegistered') {
            ideaId = parsed.args.ideaId.toString();
            break;
          }
        } catch (e) {
          // Skip logs that don't match our interface
          continue;
        }
      }

      return {
        success: true,
        ideaId,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Blockchain registration failed:', error);

      // Handle specific error types
      if (error.code === 'ACTION_REJECTED') {
        throw new Error('Transaction was rejected by user');
      } else if (error.code === 'INSUFFICIENT_FUNDS') {
        throw new Error('Insufficient funds for transaction');
      } else if (error.message.includes('execution reverted')) {
        throw new Error('Smart contract execution failed: ' + error.reason);
      } else {
        throw new Error(`Blockchain error: ${error.message}`);
      }
    }
  }

  // Get public ideas from blockchain
  async getPublicIdeas(offset = 0, limit = 10) {
    if (!this.isContractDeployed || !this.contract) {
      console.log('📝 IPFS-only mode: Returning empty ideas list');
      return [];
    }

    try {
      console.log(`📖 Fetching public ideas (${offset}-${offset + limit})...`);

      const ideas = await this.contract.getPublicIdeas(offset, limit);

      return ideas.map(idea => ({
        id: idea.id.toString(),
        owner: idea.owner,
        metadataHash: idea.metadataHash,
        timestamp: new Date(Number(idea.timestamp) * 1000).toISOString()
      }));

    } catch (error) {
      console.error('❌ Error fetching public ideas:', error);
      throw new Error(`Failed to fetch ideas: ${error.message}`);
    }
  }

  // Get specific idea details
  async getIdeaDetails(ideaId) {
    if (!this.isContractDeployed || !this.contract) {
      console.log('📝 IPFS-only mode: Cannot fetch idea details from blockchain');
      return null;
    }

    try {
      console.log(`📖 Fetching idea details for ID: ${ideaId}`);

      const idea = await this.contract.getIdeaDetails(ideaId);

      return {
        id: idea.id.toString(),
        owner: idea.owner,
        metadataHash: idea.metadataHash,
        timestamp: new Date(Number(idea.timestamp) * 1000).toISOString(),
        isPrivate: idea.isPrivate,
        accessHash: idea.accessHash,
        exists: idea.exists
      };

    } catch (error) {
      console.error('❌ Error fetching idea details:', error);
      throw new Error(`Failed to fetch idea details: ${error.message}`);
    }
  }

  // Get user's ideas
  async getUserIdeas(userAddress) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      console.log(`📖 Fetching ideas for user: ${userAddress}`);

      // This requires the user to be connected with their wallet
      const ideaIds = await this.contract.getMyIdeas();

      return ideaIds.map(id => id.toString());

    } catch (error) {
      console.error('❌ Error fetching user ideas:', error);
      throw new Error(`Failed to fetch user ideas: ${error.message}`);
    }
  }

  // Verify idea ownership
  async verifyOwnership(ideaId, ownerAddress) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      return await this.contract.verifyIdeaOwnership(ideaId, ownerAddress);
    } catch (error) {
      console.error('❌ Error verifying ownership:', error);
      return false;
    }
  }

  // Get total public ideas count
  async getTotalPublicIdeas() {
    if (!this.isContractDeployed || !this.contract) {
      console.log('📝 IPFS-only mode: Returning 0 for total ideas');
      return '0';
    }

    try {
      const total = await this.contract.getTotalPublicIdeas();
      return total.toString();
    } catch (error) {
      console.error('❌ Error getting total ideas:', error);
      return '0';
    }
  }

  // Get current gas price
  async getGasPrice() {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      const feeData = await this.provider.getFeeData();
      return {
        gasPrice: feeData.gasPrice?.toString(),
        maxFeePerGas: feeData.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString()
      };
    } catch (error) {
      console.error('❌ Error getting gas price:', error);
      return null;
    }
  }

  // Get network information
  async getNetworkInfo() {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

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
      console.error('❌ Error getting network info:', error);
      return null;
    }
  }

  // Estimate gas for idea registration
  async estimateRegistrationGas(metadataHash, isPrivate = false, accessHash = '') {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const gasEstimate = await this.contract.registerIdea.estimateGas(
        metadataHash,
        isPrivate,
        accessHash
      );

      const gasPrice = await this.getGasPrice();
      const gasCost = gasEstimate * BigInt(gasPrice.gasPrice || '20000000000');

      return {
        gasLimit: gasEstimate.toString(),
        gasPrice: gasPrice.gasPrice,
        estimatedCost: ethers.formatEther(gasCost),
        currency: 'MATIC' // or ETH depending on network
      };

    } catch (error) {
      console.error('❌ Error estimating gas:', error);
      throw new Error(`Gas estimation failed: ${error.message}`);
    }
  }

  // Check if service is ready
  isReady() {
    return !!(this.provider && this.contract && this.signer);
  }

  // Get contract address
  getContractAddress() {
    return this.contractAddress;
  }

  // Get current user address
  async getCurrentUser() {
    if (!this.signer) {
      return null;
    }

    try {
      return await this.signer.getAddress();
    } catch (error) {
      console.error('❌ Error getting current user:', error);
      return null;
    }
  }
}

// Export singleton instance
export default new BlockchainService();
