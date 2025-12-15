class IPFSService {
  constructor() {
    this.pinataJWT = import.meta.env.VITE_PINATA_JWT;
    this.gateway = import.meta.env.VITE_PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';
    this.apiUrl = 'https://api.pinata.cloud';
  }

  // Check if service is configured
  isConfigured() {
    return !!this.pinataJWT;
  }

  // Upload JSON data to IPFS
  async uploadJSON(data, metadata = {}) {
    if (!this.isConfigured()) {
      throw new Error('IPFS service not configured. Please set VITE_PINATA_JWT in your .env file');
    }

    try {
      console.log('📤 Uploading JSON to IPFS...');

      const pinataMetadata = {
        name: metadata.name || `idea-data-${Date.now()}`,
        keyvalues: {
          type: 'idea-data',
          timestamp: new Date().toISOString(),
          ...metadata.keyvalues
        }
      };

      const requestBody = {
        pinataContent: data,
        pinataMetadata,
        pinataOptions: {
          cidVersion: 1
        }
      };

      const response = await fetch(`${this.apiUrl}/pinning/pinJSONToIPFS`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.pinataJWT}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Pinata API error: ${error.error || response.statusText}`);
      }

      const result = await response.json();

      console.log('✅ JSON uploaded to IPFS:', result.IpfsHash);

      return {
        hash: result.IpfsHash,
        size: result.PinSize,
        timestamp: result.Timestamp,
        url: `${this.gateway}${result.IpfsHash}`
      };

    } catch (error) {
      console.error('❌ IPFS JSON upload failed:', error);
      throw new Error(`Failed to upload to IPFS: ${error.message}`);
    }
  }

  // Upload file to IPFS
  async uploadFile(file, metadata = {}) {
    if (!this.isConfigured()) {
      throw new Error('IPFS service not configured. Please set VITE_PINATA_JWT in your .env file');
    }

    try {
      console.log('📤 Uploading file to IPFS:', file.name);

      const formData = new FormData();
      formData.append('file', file);

      const pinataMetadata = {
        name: metadata.name || file.name,
        keyvalues: {
          type: 'idea-file',
          originalName: file.name,
          timestamp: new Date().toISOString(),
          ...metadata.keyvalues
        }
      };

      formData.append('pinataMetadata', JSON.stringify(pinataMetadata));
      formData.append('pinataOptions', JSON.stringify({
        cidVersion: 1
      }));

      const response = await fetch(`${this.apiUrl}/pinning/pinFileToIPFS`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.pinataJWT}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Pinata API error: ${error.error || response.statusText}`);
      }

      const result = await response.json();

      console.log('✅ File uploaded to IPFS:', result.IpfsHash);

      return {
        hash: result.IpfsHash,
        size: result.PinSize,
        timestamp: result.Timestamp,
        url: `${this.gateway}${result.IpfsHash}`,
        filename: file.name,
        mimetype: file.type
      };

    } catch (error) {
      console.error('❌ IPFS file upload failed:', error);
      throw new Error(`Failed to upload file to IPFS: ${error.message}`);
    }
  }

  // Get content from IPFS
  async getContent(hash) {
    try {
      console.log('📥 Fetching content from IPFS:', hash);

      // Try multiple gateways for redundancy
      const gateways = [
        `${this.gateway}${hash}`,
        `https://ipfs.io/ipfs/${hash}`,
        `https://cloudflare-ipfs.com/ipfs/${hash}`,
        `https://dweb.link/ipfs/${hash}`
      ];

      for (const gateway of gateways) {
        try {
          const response = await fetch(gateway, {
            timeout: 10000 // 10 second timeout
          });

          if (response.ok) {
            const contentType = response.headers.get('content-type');

            if (contentType && contentType.includes('application/json')) {
              const content = await response.json();
              console.log('✅ JSON content retrieved from IPFS');
              return content;
            } else {
              const content = await response.text();
              console.log('✅ Text content retrieved from IPFS');
              return content;
            }
          }
        } catch (error) {
          console.warn(`⚠️ Gateway ${gateway} failed:`, error.message);
          continue;
        }
      }

      throw new Error('All IPFS gateways failed');

    } catch (error) {
      console.error('❌ IPFS content retrieval failed:', error);
      throw new Error(`Failed to retrieve content from IPFS: ${error.message}`);
    }
  }

  // Upload complete idea data
  async uploadCompleteIdeaData(ideaData) {
    const contentHash = this.generateContentHash(ideaData);

    const completeIdeaData = {
      // Basic info
      title: ideaData.title,
      description: ideaData.description,
      category: ideaData.category || 'other',
      tags: ideaData.tags || [],

      // Owner info
      owner: ideaData.owner,
      ownerAddress: ideaData.ownerAddress,

      // Files
      supportingFiles: ideaData.supportingFiles || [],

      // Metadata
      timestamp: new Date().toISOString(),
      contentHash,
      version: '2.0',

      // Privacy
      isPrivate: ideaData.isPrivate || false,

      // Proof of creation
      creationProof: {
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };

    const metadata = {
      name: `idea-${ideaData.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`,
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

  // Upload private access data (encrypted)
  async uploadPrivateAccessData(accessData, password) {
    const encryptedData = await this.encryptData(accessData, password);

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

  // Simple encryption using Web Crypto API
  async encryptData(data, password) {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(JSON.stringify(data));

      // Generate key from password
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
      );

      const salt = crypto.getRandomValues(new Uint8Array(16));
      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
      );

      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        dataBuffer
      );

      return {
        encrypted: Array.from(new Uint8Array(encrypted)),
        iv: Array.from(iv),
        salt: Array.from(salt),
        algorithm: 'AES-GCM'
      };

    } catch (error) {
      console.error('❌ Encryption failed:', error);
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  // Decrypt data
  async decryptData(encryptedData, password) {
    try {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      // Recreate key from password
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
      );

      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: new Uint8Array(encryptedData.salt),
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );

      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: new Uint8Array(encryptedData.iv)
        },
        key,
        new Uint8Array(encryptedData.encrypted)
      );

      const decryptedText = decoder.decode(decrypted);
      return JSON.parse(decryptedText);

    } catch (error) {
      console.error('❌ Decryption failed:', error);
      throw new Error('Invalid password or corrupted data');
    }
  }

  // Generate content hash
  generateContentHash(content) {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(content));

    return crypto.subtle.digest('SHA-256', data).then(hashBuffer => {
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    });
  }

  // Test IPFS connection
  async testConnection() {
    if (!this.isConfigured()) {
      return { status: 'not-configured', error: 'PINATA_JWT not set' };
    }

    try {
      const response = await fetch(`${this.apiUrl}/data/testAuthentication`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.pinataJWT}`
        }
      });

      if (response.ok) {
        return { status: 'connected', timestamp: new Date().toISOString() };
      } else {
        const error = await response.json();
        return { status: 'error', error: error.error || 'Authentication failed' };
      }

    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }

  // Get file info from IPFS
  async getFileInfo(hash) {
    try {
      const response = await fetch(`${this.gateway}${hash}`, {
        method: 'HEAD'
      });

      if (response.ok) {
        return {
          size: response.headers.get('content-length'),
          type: response.headers.get('content-type'),
          lastModified: response.headers.get('last-modified')
        };
      } else {
        throw new Error('File not found');
      }

    } catch (error) {
      console.error('❌ Error getting file info:', error);
      throw new Error(`Failed to get file info: ${error.message}`);
    }
  }
}

// Export singleton instance
export default new IPFSService();
