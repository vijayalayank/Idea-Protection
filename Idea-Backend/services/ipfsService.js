const PinataSDK = require('@pinata/sdk');
const crypto = require('crypto');

class IPFSService {
  constructor() {
    this.pinata = null;
    this.connected = false;
    this.initialize();
  }

  async initialize() {
    try {
      if (process.env.PINATA_API_KEY && process.env.PINATA_SECRET_API_KEY) {
        this.pinata = new PinataSDK({
          pinataApiKey: process.env.PINATA_API_KEY,
          pinataSecretApiKey: process.env.PINATA_SECRET_API_KEY
        });

        // Test connection
        await this.pinata.testAuthentication();
        this.connected = true;
        console.log('✅ IPFS (Pinata) service initialized');
      } else {
        console.warn('⚠️ IPFS service not configured (missing Pinata JWT)');
        // For development, we'll simulate IPFS
        this.connected = false;
      }
    } catch (error) {
      console.error('❌ IPFS initialization failed:', error.message);
      this.connected = false;
    }
  }

  isConnected() {
    return this.connected;
  }

  async uploadJSON(data, metadata = {}) {
    if (!this.connected) {
      throw new Error('IPFS service not connected');
    }

    try {
      const options = {
        pinataMetadata: {
          name: metadata.name || `idea-data-${Date.now()}`,
          keyvalues: {
            type: 'idea-data',
            timestamp: new Date().toISOString(),
            ...metadata.keyvalues
          }
        },
        pinataOptions: {
          cidVersion: 0
        }
      };

      const result = await this.pinata.pinJSONToIPFS(data, options);

      return {
        hash: result.IpfsHash,
        size: result.PinSize,
        timestamp: result.Timestamp,
        url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`
      };

    } catch (error) {
      console.error('IPFS JSON upload error:', error);
      throw new Error(`Failed to upload to IPFS: ${error.message}`);
    }
  }

  async uploadFile(fileBuffer, filename, metadata = {}) {
    if (!this.connected) {
      throw new Error('IPFS service not connected');
    }

    try {
      const options = {
        pinataMetadata: {
          name: metadata.name || filename || `file-${Date.now()}`,
          keyvalues: {
            type: 'idea-file',
            originalName: filename,
            timestamp: new Date().toISOString(),
            ...metadata.keyvalues
          }
        },
        pinataOptions: {
          cidVersion: 0
        }
      };

      const result = await this.pinata.pinFileToIPFS(fileBuffer, options);

      return {
        hash: result.IpfsHash,
        size: result.PinSize,
        timestamp: result.Timestamp,
        url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
        filename: filename
      };

    } catch (error) {
      console.error('IPFS file upload error:', error);
      throw new Error(`Failed to upload file to IPFS: ${error.message}`);
    }
  }

  async getContent(hash) {
    try {
      const url = `https://gateway.pinata.cloud/ipfs/${hash}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text();
      }

    } catch (error) {
      console.error('IPFS content retrieval error:', error);
      throw new Error(`Failed to retrieve content from IPFS: ${error.message}`);
    }
  }

  async pinList(filters = {}) {
    if (!this.connected) {
      throw new Error('IPFS service not connected');
    }

    try {
      const result = await this.pinata.pinList(filters);
      return result.rows.map(pin => ({
        hash: pin.ipfs_pin_hash,
        size: pin.size,
        timestamp: pin.date_pinned,
        metadata: pin.metadata
      }));

    } catch (error) {
      console.error('IPFS pin list error:', error);
      throw new Error(`Failed to get pin list: ${error.message}`);
    }
  }

  async unpinContent(hash) {
    if (!this.connected) {
      throw new Error('IPFS service not connected');
    }

    try {
      await this.pinata.unpin(hash);
      return { success: true, hash };

    } catch (error) {
      console.error('IPFS unpin error:', error);
      throw new Error(`Failed to unpin content: ${error.message}`);
    }
  }

  // Utility methods
  generateContentHash(content) {
    return crypto.createHash('sha256').update(JSON.stringify(content)).digest('hex');
  }

  hashIP(ipAddress) {
    // Hash IP for privacy while maintaining uniqueness
    return crypto.createHash('sha256').update(ipAddress + process.env.IP_SALT || 'default-salt').digest('hex').substring(0, 16);
  }

  encryptData(data, password) {
    // Simple encryption for private data (in production, use more robust encryption)
    const algorithm = 'aes-256-gcm';
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
      const algorithm = encryptedData.algorithm || 'aes-256-gcm';
      const key = crypto.scryptSync(password, 'salt', 32);

      const decipher = crypto.createDecipher(algorithm, key);
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return JSON.parse(decrypted);
    } catch (error) {
      throw new Error('Invalid password or corrupted data');
    }
  }

  async uploadCompleteIdeaData(ideaData) {
    const contentHash = this.generateContentHash(ideaData);

    // Store ALL idea data in IPFS
    const completeIdeaData = {
      // Basic info
      title: ideaData.title,
      description: ideaData.description,
      category: ideaData.category || 'other',
      tags: ideaData.tags || [],

      // Owner info
      owner: ideaData.owner,
      ownerAddress: ideaData.ownerAddress,

      // Files (if any)
      supportingFiles: ideaData.supportingFiles || [],

      // Metadata
      timestamp: new Date().toISOString(),
      contentHash,
      version: '2.0',

      // Privacy settings
      isPrivate: ideaData.isPrivate || false,

      // Proof of creation
      creationProof: {
        userAgent: ideaData.userAgent,
        ipAddress: ideaData.ipAddress ? this.hashIP(ideaData.ipAddress) : null,
        browserFingerprint: ideaData.browserFingerprint
      }
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
    // For private ideas, create encrypted access data
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

  async uploadIdeaFile(fileBuffer, filename, ideaTitle) {
    const metadata = {
      name: `idea-file-${ideaTitle.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`,
      keyvalues: {
        ideaTitle,
        fileType: 'supporting-document'
      }
    };

    return await this.uploadFile(fileBuffer, filename, metadata);
  }

  // Health check
  async healthCheck() {
    if (!this.connected) {
      return { status: 'disconnected', error: 'Service not initialized' };
    }

    try {
      await this.pinata.testAuthentication();
      return { status: 'connected', timestamp: new Date().toISOString() };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }
}

module.exports = new IPFSService();
