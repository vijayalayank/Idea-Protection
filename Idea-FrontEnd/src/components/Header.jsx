import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, ChevronDown, Copy, ExternalLink, LogOut } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import styles from './Header.module.css';

const Header = () => {
  const {
    account,
    chainId,
    balance,
    isConnecting,
    isMetaMaskInstalled,
    connectWallet,
    disconnectWallet,
    getNetworkName
  } = useWallet();

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  return (
    <>
      {/* MetaMask Installation Banner */}
      {!isMetaMaskInstalled && (
        <div className={styles.installBanner}>
          <div className={styles.installBannerContent}>
            <div className={styles.installBannerIcon}>
              <Wallet size={20} />
            </div>
            <div className={styles.installBannerText}>
              <span className={styles.installBannerTitle}>MetaMask Required</span>
              <span className={styles.installBannerDescription}>
                Install MetaMask browser extension to connect your wallet and register ideas
              </span>
            </div>
            <button
              className={styles.installBannerButton}
              onClick={() => window.open('https://metamask.io/download/', '_blank')}
            >
              <ExternalLink size={16} />
              Install Now
            </button>
            <button
              className={styles.installBannerClose}
              onClick={() => setShowDropdown(false)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      <header className={styles.header}>
        <div className={styles.headerContainer}>
          <div className={styles.headerContent}>
          {/* Logo */}
          <div style={{display: 'flex', alignItems: 'center'}}>
            <Link to="/" className={styles.logo}>
              <div className={styles.logoIcon}>
                <span style={{color: 'white', fontWeight: 'bold', fontSize: '0.875rem'}}>M</span>
              </div>
              <span className={styles.logoText}>MuseChain</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className={styles.nav}>
            <Link to="/features" className={styles.navLink}>
              Features
            </Link>
            <Link to="/registry" className={styles.navLink}>
              Registry
            </Link>
            <Link to="/about" className={styles.navLink}>
              About
            </Link>
          </nav>

          {/* Wallet Section */}
          <div className={styles.walletSection}>
            {!account ? (
              <>
                {!isMetaMaskInstalled ? (
                  <div className={styles.installPrompt}>
                    <button
                      className={styles.installMetaMaskBtn}
                      onClick={() => window.open('https://metamask.io/download/', '_blank')}
                    >
                      <Wallet size={18} />
                      <span>Install MetaMask</span>
                    </button>
                  </div>
                ) : (
                  <button
                    className={styles.connectWalletBtn}
                    onClick={connectWallet}
                    disabled={isConnecting}
                  >
                    <Wallet size={18} />
                    <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
                  </button>
                )}
              </>
            ) : (
              <div className={styles.walletConnected} ref={dropdownRef}>
                <div
                  className={styles.walletInfo}
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <div className={styles.walletAvatar}>
                    <div className={styles.avatarIcon}>
                      <Wallet size={16} />
                    </div>
                    <div className={`${styles.networkIndicator} ${
                      chainId === 1 ? styles.mainnet :
                      chainId === 137 ? styles.polygon :
                      styles.testnet
                    }`}></div>
                  </div>
                  <div className={styles.walletDetails}>
                    <span className={styles.walletAddress}>
                      {`${account.slice(0, 6)}...${account.slice(-4)}`}
                    </span>
                    <span className={styles.walletBalance}>
                      {balance ? `${balance} ETH` : '0.0000 ETH'}
                    </span>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`${styles.dropdownIcon} ${showDropdown ? styles.dropdownIconOpen : ''}`}
                  />
                </div>

                {showDropdown && (
                  <div className={styles.walletDropdown}>
                    <div className={styles.dropdownHeader}>
                      <div className={styles.networkInfo}>
                        <span className={styles.networkLabel}>Network:</span>
                        <span className={styles.networkName}>
                          {chainId ? getNetworkName(chainId) : 'Unknown'}
                        </span>
                      </div>
                    </div>

                    <div className={styles.dropdownActions}>
                      <button
                        className={styles.dropdownAction}
                        onClick={() => {
                          navigator.clipboard.writeText(account);
                          alert('Address copied to clipboard!');
                        }}
                      >
                        <Copy size={16} />
                        Copy Address
                      </button>

                      <button
                        className={styles.dropdownAction}
                        onClick={() => {
                          const etherscanUrl = chainId === 1
                            ? `https://etherscan.io/address/${account}`
                            : `https://etherscan.io/address/${account}`;
                          window.open(etherscanUrl, '_blank');
                        }}
                      >
                        <ExternalLink size={16} />
                        View on Explorer
                      </button>

                      <button
                        className={styles.dropdownAction}
                        onClick={() => {
                          disconnectWallet();
                          setShowDropdown(false);
                        }}
                      >
                        <LogOut size={16} />
                        Disconnect
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
    </>
  );
};

export default Header;
