import React, { createContext, useContext, useState, useEffect } from 'react';
import ideaRegistrationService from '../services/ideaRegistrationService.js';

const WalletContext = createContext();

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState(null);
  const [servicesReady, setServicesReady] = useState(false);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  };

  // Get current account
  const getCurrentAccount = async () => {
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_accounts'
      });
      return accounts[0] || null;
    } catch (error) {
      console.error('Error getting current account:', error);
      return null;
    }
  };

  // Get account balance
  const getBalance = async (address) => {
    try {
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      });
      // Convert from wei to ETH
      const balanceInEth = parseInt(balance, 16) / Math.pow(10, 18);
      // Format balance properly
      if (balanceInEth === 0) return '0.0000';
      if (balanceInEth < 0.0001) return '<0.0001';
      return balanceInEth.toFixed(4);
    } catch (error) {
      console.error('Error getting balance:', error);
      return '0.0000';
    }
  };

  // Get current chain ID
  const getCurrentChainId = async () => {
    try {
      const chainId = await window.ethereum.request({
        method: 'eth_chainId'
      });
      return parseInt(chainId, 16);
    } catch (error) {
      console.error('Error getting chain ID:', error);
      return null;
    }
  };

  // Connect to MetaMask
  const connectWallet = async () => {
    if (!isMetaMaskInstalled()) {
      alert('MetaMask is not installed. Please install MetaMask to continue.');
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    setIsConnecting(true);

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length > 0) {
        const account = accounts[0];
        setAccount(account);

        // Get additional wallet info
        const chainId = await getCurrentChainId();
        const balance = await getBalance(account);

        setChainId(chainId);
        setBalance(balance);

        // Initialize blockchain and IPFS services
        // Force switch to Amoy if not already on it
        if (chainId !== 80002) {
          try {
            await switchNetwork(80002);
            setChainId(80002);
          } catch (switchError) {
            console.error("Failed to switch to Amoy network", switchError);
            alert("Please switch to Polygon Amoy Testnet to use this app.");
          }
        }

        try {
          await ideaRegistrationService.initialize(window.ethereum);
          setServicesReady(true);
          console.log('✅ All services initialized successfully');
        } catch (error) {
          console.error('❌ Service initialization failed:', error);
          setServicesReady(false);
          alert(`Service initialization failed: ${error.message}`);
        }

        console.log('Wallet connected:', {
          account,
          chainId,
          balance,
          servicesReady: ideaRegistrationService.isReady()
        });
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      if (error.code === 4001) {
        alert('Please connect to MetaMask.');
      } else {
        alert('An error occurred while connecting to MetaMask.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setAccount(null);
    setChainId(null);
    setBalance(null);
    setServicesReady(false);
  };

  // Switch to a specific network
  const switchNetwork = async (targetChainId) => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }]
      });
    } catch (error) {
      // This error code indicates that the chain has not been added to MetaMask
      if (error.code === 4902) {
        try {
          if (targetChainId === 80002) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0x13882', // 80002 in hex
                  chainName: 'Polygon Amoy Testnet',
                  rpcUrls: ['https://rpc-amoy.polygon.technology/'],
                  nativeCurrency: {
                    name: 'MATIC',
                    symbol: 'MATIC',
                    decimals: 18
                  },
                  blockExplorerUrls: ['https://amoy.polygonscan.com/']
                }
              ]
            });
          }
        } catch (addError) {
          console.error('Error adding network:', addError);
          throw addError;
        }
      } else {
        console.error('Error switching network:', error);
        throw error;
      }
    }
  };

  // Get network name
  const getNetworkName = (chainId) => {
    const networks = {
      1: 'Ethereum Mainnet',
      11155111: 'Sepolia Testnet',
      137: 'Polygon Mainnet',
      80001: 'Polygon Mumbai Testnet',
      80002: 'Polygon Amoy Testnet', // Added Amoy
    };
    return networks[chainId] || `Chain ID: ${chainId}`;
  };

  // Listen for account changes
  useEffect(() => {
    if (!isMetaMaskInstalled()) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (accounts[0] !== account) {
        setAccount(accounts[0]);
        getBalance(accounts[0]).then(setBalance);
      }
    };

    const handleChainChanged = (chainId) => {
      const newChainId = parseInt(chainId, 16);
      setChainId(newChainId);
      // Refresh balance when chain changes
      if (account) {
        getBalance(account).then(setBalance);
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [account]);

  // Check for existing connection on mount
  useEffect(() => {
    if (isMetaMaskInstalled()) {
      const checkConnection = async () => {
        try {
          const account = await getCurrentAccount();
          if (account) {
            // Get chain ID BEFORE setting account to avoid "ETH" flicker
            const currentChainId = await getCurrentChainId();
            setChainId(currentChainId);
            setAccount(account); // Now UI renders with correct chain ID established

            getBalance(account).then(setBalance);

            // Force switch on load if not Amoy
            if (currentChainId !== 80002) {
              try {
                await switchNetwork(80002);
                setChainId(80002);
              } catch (error) {
                console.error("Failed to switch network on load:", error);
              }
            }

            // Initialize services
            try {
              await ideaRegistrationService.initialize(window.ethereum);
              setServicesReady(true);
            } catch (error) {
              console.error('Service initialization failed:', error);
            }
          }
        } catch (error) {
          console.error("Error checking connection:", error);
        }
      };

      checkConnection();
    }
  }, []);

  const value = {
    account,
    chainId,
    balance,
    isConnecting,
    servicesReady,
    isMetaMaskInstalled: isMetaMaskInstalled(),
    connectWallet,
    disconnectWallet,
    switchNetwork,
    getNetworkName
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
