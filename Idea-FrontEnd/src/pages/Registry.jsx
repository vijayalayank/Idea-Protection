import React, { useState, useEffect } from 'react';
import { Search, Calendar, User, Hash, CheckCircle, ExternalLink } from 'lucide-react';
import ideaRegistrationService from '../services/ideaRegistrationService.js';
import { useWallet } from '../contexts/WalletContext';
import styles from './Registry.module.css';

const Registry = () => {
  const { servicesReady, account, isConnecting } = useWallet();
  const [searchTerm, setSearchTerm] = useState('');
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load ideas from blockchain and IPFS
  useEffect(() => {
    const loadIdeas = async () => {
      try {
        setLoading(true);
        setError(null);

        if (servicesReady && ideaRegistrationService.isReady()) {
          console.log('📖 Loading ideas from blockchain...');

          // Get public ideas from blockchain + IPFS
          const blockchainIdeas = await ideaRegistrationService.getPublicIdeas(0, 20);
          setIdeas(blockchainIdeas);

          console.log(`✅ Loaded ${blockchainIdeas.length} ideas from blockchain`);
        } else {
          // Fallback to demo data if services not ready
          console.log('⚠️ Services not ready, loading demo data...');

          const demoIdeas = JSON.parse(localStorage.getItem('demoIdeas') || '[]');

          // Add sample ideas if none exist
          if (demoIdeas.length === 0) {
            const sampleIdeas = [
              {
                id: 1,
                title: "Decentralized Social Media Platform",
                description: "A blockchain-based social media platform that gives users control over their data and content monetization.",
                owner: "0x1234...5678",
                timestamp: new Date(Date.now() - 86400000).toISOString(),
                transactionHash: "0xabcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab",
                metadataHash: "QmSampleHash1234567890abcdef"
              },
              {
                id: 2,
                title: "AI-Powered Code Review Tool",
                description: "An intelligent code review system that uses machine learning to identify bugs, security vulnerabilities, and optimization opportunities.",
                owner: "0x9876...5432",
                timestamp: new Date(Date.now() - 172800000).toISOString(),
                transactionHash: "0xefgh5678901234567890efgh5678901234567890efgh5678901234567890ef",
                metadataHash: "QmSampleHash5678901234567890"
              }
            ];
            setIdeas(sampleIdeas);
          } else {
            setIdeas(demoIdeas);
          }
        }

      } catch (error) {
        console.error('❌ Failed to load ideas:', error);
        setError(error.message);

        // Fallback to demo data on error
        const demoIdeas = JSON.parse(localStorage.getItem('demoIdeas') || '[]');
        setIdeas(demoIdeas);
      } finally {
        setLoading(false);
      }
    };

    loadIdeas();
  }, [servicesReady, account]); // Reload when account or services change

  // Filter ideas based on search term
  const filteredEntries = ideas.filter(entry =>
    (entry.title && entry.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (entry.transactionHash && entry.transactionHash.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (entry.metadataHash && entry.metadataHash.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (entry.owner && entry.owner.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateHash = (hash) => {
    if (!hash) return 'N/A';
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  };

  const truncateAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };


  const [selectedIdea, setSelectedIdea] = useState(null);

  const handleViewDetails = (idea) => {
    setSelectedIdea(idea);
  };

  const closeModal = () => {
    setSelectedIdea(null);
  };

  // Close modal on escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            Idea{' '}
            <span className={styles.gradientText}>
              Registry
            </span>
          </h1>
          <p className={styles.description}>
            Browse all registered intellectual property on the blockchain. Verify ownership and timestamps.
          </p>

          {/* Mode Indicator */}
          <div className={`${styles.modeIndicator} ${servicesReady ? styles.blockchainMode : styles.demoMode}`}>
            {servicesReady && ideaRegistrationService.isReady() ? (
              <>⛓️ <strong>Blockchain Mode:</strong> Showing real ideas from blockchain and IPFS</>
            ) : (
              <>🚀 <strong>Demo Mode:</strong> Connect wallet to access blockchain data</>
            )}
          </div>

          {/* Search Bar */}
          <div className={styles.searchContainer}>
            <Search className={styles.searchIcon} size={20} />
            <input
              type="text"
              placeholder="Search by title, hash, or owner address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p className={styles.loadingText}>Loading ideas from blockchain...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className={styles.errorContainer}>
            <p className={styles.errorText}>❌ Error loading ideas: {error}</p>
            <button
              className={styles.retryButton}
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        )}

        {/* Registry Entries */}
        {!loading && !error && (
          <div className={styles.entriesContainer}>
            {filteredEntries.map((entry) => (
              <div key={entry.id} className={styles.registryEntry}>
                <div className={styles.entryContent}>
                  <div className={styles.entryMain}>
                    <div className={styles.entryHeader}>
                      <h3 className={styles.entryTitle}>{entry.title}</h3>
                      <CheckCircle className={styles.verifiedIcon} size={24} />
                    </div>

                    <div className={styles.entryDetails}>
                      <div className={styles.entryDetail}>
                        <Hash size={16} />
                        <span className={styles.monoFont}>{truncateHash(entry.transactionHash || entry.metadataHash)}</span>
                      </div>
                      <div className={styles.entryDetail}>
                        <Calendar size={16} />
                        <span>{formatDate(entry.timestamp)}</span>
                      </div>
                      <div className={styles.entryDetail}>
                        <User size={16} />
                        <span className={styles.monoFont}>{truncateAddress(entry.owner)}</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.entryActions}>
                    <button
                      className={styles.btnPrimary}
                      onClick={() => handleViewDetails(entry)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {!loading && !error && filteredEntries.length === 0 && (
          <div className={styles.noResults}>
            <p className={styles.noResultsText}>No entries found matching your search.</p>
          </div>
        )}
      </div>

      {/* Idea Details Modal */}
      {selectedIdea && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{selectedIdea.title}</h2>
              <button className={styles.closeButton} onClick={closeModal}>&times;</button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.modalSection}>
                <h3 className={styles.sectionTitle}>Description</h3>
                <p className={styles.descriptionText}>{selectedIdea.description || 'No description available.'}</p>
              </div>

              {selectedIdea.tags && selectedIdea.tags.length > 0 && (
                <div className={styles.modalSection}>
                  <h3 className={styles.sectionTitle}>Tags</h3>
                  <div className={styles.tagsList}>
                    {selectedIdea.tags.map((tag, index) => (
                      <span key={index} className={styles.tag}>{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.modalSection}>
                <h3 className={styles.sectionTitle}>Verification Details</h3>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Owner:</span>
                  <span className={styles.detailValue}>{selectedIdea.owner}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Registered:</span>
                  <span className={styles.detailValue}>{formatDate(selectedIdea.timestamp)}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Metadata Hash (IPFS):</span>
                  <a
                    href={selectedIdea.ipfsUrl || `https://gateway.pinata.cloud/ipfs/${selectedIdea.metadataHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.link}
                  >
                    {selectedIdea.metadataHash} <ExternalLink size={14} />
                  </a>
                </div>
                {selectedIdea.transactionHash && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Transaction Hash:</span>
                    <a
                      href={selectedIdea.explorerUrl || `https://amoy.polygonscan.com/tx/${selectedIdea.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.link}
                    >
                      {truncateHash(selectedIdea.transactionHash)} <ExternalLink size={14} />
                    </a>
                  </div>
                )}
              </div>

              {selectedIdea.supportingFiles && selectedIdea.supportingFiles.length > 0 && (
                <div className={styles.modalSection}>
                  <h3 className={styles.sectionTitle}>Supporting Files</h3>
                  <ul className={styles.fileList}>
                    {selectedIdea.supportingFiles.map((file, index) => (
                      <li key={index} className={styles.fileItem}>
                        <a href={file.url} target="_blank" rel="noopener noreferrer" className={styles.fileLink}>
                          📄 {file.filename || file.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Registry;
