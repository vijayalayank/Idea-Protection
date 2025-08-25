const crypto = require('crypto');

class MockIPFSService {
  constructor() {
    this.storage = new Map(); // Mock storage
    this.connected = true;
  }

  async initialize() {
    console.log('✅ Mock IPFS service initialized (for development)');
  }

  isConnected() {
    return this.connected;
  }

  // Mock IPFS upload - generates fake hash and stores data
  async uploadJSON(data, metadata = {}) {
    try {
      const hash = this.generateHash(JSON.stringify(data));
      
      this.storage.set(hash, {
        data,
        metadata,
        timestamp: new Date().toISOString(),
        type: 'json'
      });

      return {
        hash,
        size: JSON.stringify(data).length,
        timestamp: new Date().toISOString(),
        url: `https://mock-ipfs-gateway.com/ipfs/${hash}`
      };

    } catch (error) {
      console.error('Mock IPFS JSON upload error:', error);
      throw new Error(`Failed to upload to mock IPFS: ${error.message}`);
    }
  }

  async uploadFile(fileBuffer, filename, metadata = {}) {
    try {
      const hash = this.generateHash(fileBuffer);
      
      this.storage.set(hash, {
        data: fileBuffer,
        filename,
        metadata,
        timestamp: new Date().toISOString(),
        type: 'file'
      });

      return {
        hash,
        size: fileBuffer.length,
        timestamp: new Date().toISOString(),
        url: `https://mock-ipfs-gateway.com/ipfs/${hash}`,
        filename
      };

    } catch (error) {
      console.error('Mock IPFS file upload error:', error);
      throw new Error(`Failed to upload file to mock IPFS: ${error.message}`);
    }
  }

  async getContent(hash) {
    try {
      const stored = this.storage.get(hash);
      
      if (!stored) {
        throw new Error('Content not found');
      }

      if (stored.type === 'json') {
        return stored.data;
      } else {
        return stored.data.toString();
      }

    } catch (error) {
      console.error('Mock IPFS content retrieval error:', error);
      throw new Error(`Failed to retrieve content: ${error.message}`);
    }
  }

  async uploadCompleteIdeaData(ideaData) {
    const contentHash = this.generateContentHash(ideaData);
    
    const completeIdeaData = {
      title: ideaData.title,
      description: ideaData.description,
      category: ideaData.category || 'other',
      tags: ideaData.tags || [],
      owner: ideaData.owner,
      ownerAddress: ideaData.ownerAddress,
      supportingFiles: ideaData.supportingFiles || [],
      timestamp: new Date().toISOString(),
      contentHash,
      version: '2.0',
      isPrivate: ideaData.isPrivate || false
    };

    const metadata = {
      name: `complete-idea-${ideaData.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`,
      keyvalues: {
        type: 'complete-idea-data',
        ideaTitle: ideaData.title,
        contentHash,
        owner: ideaData.ownerAddress,
        isPrivate: ideaData.isPrivate || false,
        version: '2.0'
      }
    };

    return await this.uploadJSON(completeIdeaData, metadata);
  }

  async uploadPrivateAccessData(accessData, password) {
    const encryptedData = this.encryptData(accessData, password);
    
    const accessInfo = {
      encryptedMetadata: encryptedData,
      accessInstructions: "This idea is private. Provide the correct password to access.",
      timestamp: new Date().toISOString(),
      version: '2.0'
    };

    const metadata = {
      name: `private-access-${Date.now()}`,
      keyvalues: {
        type: 'private-access-data',
        encrypted: true
      }
    };

    return await this.uploadJSON(accessInfo, metadata);
  }

  // Utility methods
  generateHash(content) {
    return 'Qm' + crypto.createHash('sha256').update(content).digest('hex').substring(0, 44);
  }

  generateContentHash(content) {
    return crypto.createHash('sha256').update(JSON.stringify(content)).digest('hex');
  }

  encryptData(data, password) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(password, 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      algorithm
    };
  }

  decryptData(encryptedData, password) {
    try {
      const algorithm = encryptedData.algorithm || 'aes-256-cbc';
      const key = crypto.scryptSync(password, 'salt', 32);
      
      const decipher = crypto.createDecipher(algorithm, key);
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      throw new Error('Invalid password or corrupted data');
    }
  }

  async healthCheck() {
    return { 
      status: 'connected', 
      timestamp: new Date().toISOString(),
      type: 'mock',
      storageSize: this.storage.size
    };
  }

  // Mock pin list
  async pinList() {
    const pins = [];
    for (const [hash, data] of this.storage.entries()) {
      pins.push({
        hash,
        size: JSON.stringify(data.data).length,
        timestamp: data.timestamp,
        metadata: data.metadata
      });
    }
    return pins;
  }

  async unpinContent(hash) {
    this.storage.delete(hash);
    return { success: true, hash };
  }
}

module.exports = new MockIPFSService();
