const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class DecentralizedApiService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Helper method for API calls
  async apiCall(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return await response.json();
  }

  // Register idea on decentralized network
  async registerIdea(ideaData, files = []) {
    const formData = new FormData();
    
    // Add idea data
    Object.keys(ideaData).forEach(key => {
      if (Array.isArray(ideaData[key])) {
        formData.append(key, JSON.stringify(ideaData[key]));
      } else {
        formData.append(key, ideaData[key]);
      }
    });

    // Add files
    files.forEach(file => {
      formData.append('files', file);
    });

    const response = await fetch(`${API_BASE_URL}/ideas`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Registration failed');
    }

    return await response.json();
  }

  // Get public ideas from decentralized network
  async getPublicIdeas(page = 1, limit = 10, filters = {}) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });

    const cacheKey = `public_ideas_${params.toString()}`;
    const cached = this.getCachedData(cacheKey);
    
    if (cached) {
      return cached;
    }

    const result = await this.apiCall(`/ideas?${params}`);
    
    // Cache the result
    this.setCachedData(cacheKey, result);
    
    return result;
  }

  // Get specific idea details
  async getIdeaDetails(ideaId, password = null) {
    const cacheKey = `idea_${ideaId}_${password ? 'private' : 'public'}`;
    const cached = this.getCachedData(cacheKey);
    
    if (cached) {
      return cached;
    }

    const params = password ? `?password=${encodeURIComponent(password)}` : '';
    const result = await this.apiCall(`/blockchain/ideas/${ideaId}${params}`);
    
    // Cache the result (shorter cache for private ideas)
    const cacheTime = password ? 60000 : this.cacheTimeout; // 1 minute for private
    this.setCachedData(cacheKey, result, cacheTime);
    
    return result;
  }

  // Search ideas
  async searchIdeas(query, filters = {}) {
    const params = new URLSearchParams({
      search: query,
      ...filters
    });

    return await this.apiCall(`/ideas?${params}`);
  }

  // Get blockchain network info
  async getNetworkInfo() {
    const cacheKey = 'network_info';
    const cached = this.getCachedData(cacheKey);
    
    if (cached) {
      return cached;
    }

    const result = await this.apiCall('/blockchain/network');
    
    // Cache network info for 1 minute
    this.setCachedData(cacheKey, result, 60000);
    
    return result;
  }

  // Get platform statistics
  async getStats() {
    const cacheKey = 'platform_stats';
    const cached = this.getCachedData(cacheKey);
    
    if (cached) {
      return cached;
    }

    const result = await this.apiCall('/blockchain/stats');
    
    // Cache stats for 2 minutes
    this.setCachedData(cacheKey, result, 120000);
    
    return result;
  }

  // Verify idea ownership
  async verifyOwnership(ideaId, ownerAddress) {
    return await this.apiCall('/blockchain/verify-ownership', {
      method: 'POST',
      body: JSON.stringify({
        ideaId,
        ownerAddress
      })
    });
  }

  // Get IPFS content directly
  async getIPFSContent(hash) {
    const cacheKey = `ipfs_${hash}`;
    const cached = this.getCachedData(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      // Try multiple IPFS gateways for redundancy
      const gateways = [
        `https://gateway.pinata.cloud/ipfs/${hash}`,
        `https://ipfs.io/ipfs/${hash}`,
        `https://cloudflare-ipfs.com/ipfs/${hash}`
      ];

      for (const gateway of gateways) {
        try {
          const response = await fetch(gateway);
          if (response.ok) {
            const contentType = response.headers.get('content-type');
            let content;
            
            if (contentType && contentType.includes('application/json')) {
              content = await response.json();
            } else {
              content = await response.text();
            }
            
            // Cache successful result
            this.setCachedData(cacheKey, content);
            return content;
          }
        } catch (error) {
          console.warn(`Failed to fetch from ${gateway}:`, error);
          continue;
        }
      }
      
      throw new Error('All IPFS gateways failed');
      
    } catch (error) {
      console.error('IPFS content fetch error:', error);
      throw new Error(`Failed to fetch IPFS content: ${error.message}`);
    }
  }

  // Health check
  async healthCheck() {
    return await this.apiCall('/health');
  }

  // Cache management
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < cached.timeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCachedData(key, data, timeout = this.cacheTimeout) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      timeout
    });
  }

  clearCache() {
    this.cache.clear();
  }

  // Utility methods
  formatIdeaData(rawIdea) {
    return {
      id: rawIdea.id,
      title: rawIdea.title,
      description: rawIdea.description,
      owner: rawIdea.owner,
      category: rawIdea.category,
      tags: rawIdea.tags || [],
      supportingFiles: rawIdea.supportingFiles || [],
      timestamp: rawIdea.timestamp,
      createdAt: rawIdea.createdAt,
      metadataHash: rawIdea.metadataHash,
      isPrivate: rawIdea.isPrivate || false,
      transactionHash: rawIdea.transactionHash,
      explorerUrl: rawIdea.explorerUrl
    };
  }

  // Get idea preview (for private ideas)
  getIdeaPreview(idea) {
    if (!idea.isPrivate) {
      return this.formatIdeaData(idea);
    }

    return {
      id: idea.id,
      title: 'Private Idea',
      description: 'This idea is private. Please provide the password to access.',
      owner: idea.owner,
      timestamp: idea.timestamp,
      isPrivate: true,
      accessRequired: true
    };
  }

  // Estimate gas for idea registration
  async estimateGas(ideaData) {
    return await this.apiCall('/blockchain/estimate-gas', {
      method: 'POST',
      body: JSON.stringify({
        title: ideaData.title,
        descriptionHash: 'placeholder', // Will be generated by backend
        isPrivate: ideaData.isPrivate || false
      })
    });
  }
}

// Export singleton instance
export default new DecentralizedApiService();
