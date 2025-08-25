import React, { useState } from 'react';
import { Upload, Hash, Clock, Shield, Wallet } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import ideaRegistrationService from '../services/ideaRegistrationService.js';
import styles from './Register.module.css';

const Register = () => {
  const { account, connectWallet, servicesReady } = useWallet();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    files: [],
    visibility: 'public', // 'public' or 'private'
    password: '',
    category: 'other',
    tags: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationResult, setRegistrationResult] = useState(null);
  const [hash, setHash] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      files
    }));
  };

  const generateHash = async () => {
    if (!formData.title || !formData.description) {
      alert('Please fill in title and description first');
      return;
    }

    const content = `${formData.title}${formData.description}${Date.now()}`;
    console.log("Content : ",content);
    const encoder = new TextEncoder();
    console.log("Encoder : ",encoder);
    const data = encoder.encode(content);
    console.log("Data : ",data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    console.log("Hash Buffer : ",hashBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    console.log("Hash Array : ",hashArray);
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    console.log("Hash : ",hashHex);
    setHash(`0x${hashHex}`);
    
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if wallet is connected
    if (!account) {
      alert('Please connect your wallet to register an idea.');
      return;
    }

    // Check if services are ready
    if (!servicesReady) {
      alert('Blockchain services are not ready. Please try reconnecting your wallet.');
      return;
    }

    // Validate password for private visibility
    if (formData.visibility === 'private' && !formData.password.trim()) {
      alert('Password is required for private ideas.');
      return;
    }
    console.log('Form Data : ',formData);
    setIsSubmitting(true);

    try {
      console.log('🚀 Starting real blockchain registration...');

      // Prepare idea data for registration
      const ideaData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        tags: formData.tags,
        ownerAddress: account,
        isPrivate: formData.visibility === 'private',
        password: formData.password
      };

      // Register idea using the integrated service
      const result = await ideaRegistrationService.registerIdea(ideaData, formData.files);

      setRegistrationResult(true);
      console.log('Result : ',result);

      const visibilityMessage = formData.visibility === 'private'
        ? 'Your private idea has been registered and is password protected!'
        : 'Your idea has been registered and is now visible in the public registry!';

      // Show success message with real blockchain data
      alert(`✅ SUCCESS: Idea registered on blockchain!\n\n${visibilityMessage}\n\nIdea ID: ${result.ideaId}\nTransaction: ${result.transactionHash}\nBlock: ${result.blockNumber}\nIPFS Hash: ${result.metadataHash}\n\nView on Explorer: ${result.explorerUrl}`);

      // Reset form
      setFormData({
        title: '',
        description: '',
        files: [],
        visibility: 'public',
        password: '',
        category: 'other',
        tags: []
      });

    } catch (error) {
      console.error('❌ Registration failed:', error);

      // Show user-friendly error message
      let errorMessage = 'Failed to register idea. ';

      if (error.message.includes('rejected')) {
        errorMessage += 'Transaction was rejected by user.';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage += 'Insufficient funds for transaction.';
      } else if (error.message.includes('IPFS')) {
        errorMessage += 'File upload failed. Please check your internet connection.';
      } else {
        errorMessage += error.message;
      }

      alert(`❌ ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            Register Your{' '}
            <span className={styles.gradientText}>
              Idea
            </span>
          </h1>
          <p className={styles.description}>
            Protect your intellectual property with blockchain-verified timestamps and cryptographic hashes.
          </p>
        </div>

        {/* Wallet Connection Status */}
        {!account && (
          <div className={styles.walletPrompt}>
            <div className={styles.walletPromptContent}>
              <Wallet size={48} className={styles.walletPromptIcon} />
              <h3 className={styles.walletPromptTitle}>Connect Your Wallet to Continue</h3>
              <p className={styles.walletPromptDescription}>
                To register and protect your intellectual property on the blockchain, you need to connect your MetaMask wallet first. This ensures secure ownership and immutable timestamps for your ideas.
              </p>
              <div className={styles.walletPromptFeatures}>
                <div className={styles.promptFeature}>
                  <Shield size={20} />
                  <span>Secure & Private</span>
                </div>
                <div className={styles.promptFeature}>
                  <Hash size={20} />
                  <span>Cryptographic Proof</span>
                </div>
                <div className={styles.promptFeature}>
                  <Clock size={20} />
                  <span>Immutable Timestamps</span>
                </div>
              </div>
              <button
                type="button"
                onClick={connectWallet}
                className={styles.walletPromptButton}
              >
                <Wallet size={18} />
                Connect MetaMask Wallet
              </button>
              <p className={styles.walletPromptNote}>
                Don't have MetaMask? <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer">Download it here</a>
              </p>
            </div>
          </div>
        )}

        {/* Wallet Connected Success */}
        {account && (
          <div className={styles.walletConnected}>
            <div className={styles.walletConnectedContent}>
              <div className={styles.walletConnectedIcon}>
                <Wallet size={24} />
              </div>
              <div className={styles.walletConnectedInfo}>
                <h4 className={styles.walletConnectedTitle}>Wallet Connected Successfully!</h4>
                <p className={styles.walletConnectedAddress}>
                  {`${account.slice(0, 8)}...${account.slice(-6)}`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Registration Form - Only show when wallet is connected */}
        {account && (
          <div className={styles.formContainer}>
            <form onSubmit={handleSubmit} className={styles.form}>
            {/* Title */}
            <div className={styles.formGroup}>
              <label htmlFor="title" className={styles.formLabel}>
                Idea Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className={styles.formInput}
                placeholder="Enter a descriptive title for your idea"
              />
            </div>

            {/* Description */}
            <div className={styles.formGroup}>
              <label htmlFor="description" className={styles.formLabel}>
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                className={styles.formTextarea}
                placeholder="Provide a detailed description of your idea..."
              />
            </div>

            {/* Visibility Options */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Visibility Options *
              </label>
              <div className={styles.radioGroup}>
                <div className={styles.radioOption}>
                  <input
                    type="radio"
                    id="public"
                    name="visibility"
                    value="public"
                    checked={formData.visibility === 'public'}
                    onChange={handleInputChange}
                    className={styles.radioInput}
                  />
                  <label htmlFor="public" className={styles.radioLabel}>
                    <span className={styles.radioButton}></span>
                    <div className={styles.radioContent}>
                      <span className={styles.radioTitle}>Open to everyone</span>
                      <span className={styles.radioDescription}>
                        Your idea will be visible in the public registry
                      </span>
                    </div>
                  </label>
                </div>

                <div className={styles.radioOption}>
                  <input
                    type="radio"
                    id="private"
                    name="visibility"
                    value="private"
                    checked={formData.visibility === 'private'}
                    onChange={handleInputChange}
                    className={styles.radioInput}
                  />
                  <label htmlFor="private" className={styles.radioLabel}>
                    <span className={styles.radioButton}></span>
                    <div className={styles.radioContent}>
                      <span className={styles.radioTitle}>Only I can visit my idea</span>
                      <span className={styles.radioDescription}>
                        Your idea will be private and password protected
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Password Field - Only show if private visibility is selected */}
            {formData.visibility === 'private' && (
              <div className={styles.formGroup}>
                <label htmlFor="password" className={styles.formLabel}>
                  Password Protection *
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter a secure password to protect your idea"
                  className={styles.formInput}
                  required
                />
                <p className={styles.fieldHint}>
                  This password will be required to view your idea. Make sure to remember it!
                </p>
              </div>
            )}

            {/* File Upload */}
            <div className={styles.formGroup}>
              <label htmlFor="file" className={styles.formLabel}>
                Supporting Documents (Optional)
              </label>
              <div className={styles.fileUpload}>
                <Upload style={{margin: '0 auto', color: 'var(--color-gray-400)', marginBottom: '1rem'}} size={48} />
                <input
                  type="file"
                  id="file"
                  onChange={handleFileChange}
                  className={styles.fileUploadInput}
                  accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                />
                <label htmlFor="file" className={styles.fileUploadLabel}>
                  <span className={styles.fileUploadText}>Click to upload</span>
                  <span className={styles.fileUploadSubtext}> or drag and drop</span>
                </label>
                <p className={styles.fileUploadInfo}>
                  PDF, DOC, TXT, PNG, JPG up to 10MB
                </p>
                {formData.files && formData.files.length > 0 && (
                  <p className={styles.fileSelected}>
                    Selected: {formData.files.length} file{formData.files.length > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>

            {/* Generate Hash Button */}
            <div className={styles.buttonContainer}>
              <button
                type="button"
                onClick={generateHash}
                className={styles.btnPrimary}
              >
                <Hash size={20} />
                <span>Generate Hash</span>
              </button>
            </div>

            {/* Registration Result Display */}
            {registrationResult && (
              <div className={styles.resultDisplay}>
                <h3 className={styles.resultTitle}>✅ Registration Successful!</h3>
                <div className={styles.resultDetails}>
                  <p><strong>Idea ID:</strong> {registrationResult.ideaId}</p>
                  <p><strong>Transaction:</strong>
                    <a href={registrationResult.explorerUrl} target="_blank" rel="noopener noreferrer">
                      {registrationResult.transactionHash.substring(0, 10)}...
                    </a>
                  </p>
                  <p><strong>IPFS Hash:</strong> {hash.substring(0, 10)}...</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className={styles.submitContainer}>
              <button
                type="submit"
                // disabled={isSubmitting || !account || !servicesReady}
                // className={`${styles.btnSuccess} ${(isSubmitting || !account || !servicesReady) ? styles.btnDisabled : ''}`}
              >
                {isSubmitting ? (
                  <>
                    <div className={styles.spinner}></div>
                    <span>Registering...</span>
                  </>
                ) : (
                  <>
                    {/* <Shield size={20} /> */}
                    <span>Register on Blockchain</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
        )}
      </div>

      {/* Info Cards - Always visible */}
      <div className={styles.content}>
        <div className={styles.infoCards}>
          <div className={styles.infoCard}>
            <Hash className={styles.infoCardIcon} style={{color: 'var(--color-purple-400)'}} size={32} />
            <h3 className={styles.infoCardTitle}>Cryptographic Hash</h3>
            <p className={styles.infoCardDescription}>Your idea is converted to a unique hash</p>
          </div>
          <div className={styles.infoCard}>
            <Clock className={styles.infoCardIcon} style={{color: 'var(--color-blue-400)'}} size={32} />
            <h3 className={styles.infoCardTitle}>Blockchain Timestamp</h3>
            <p className={styles.infoCardDescription}>Immutable proof of when you registered</p>
          </div>
          <div className={styles.infoCard}>
            <Shield className={styles.infoCardIcon} style={{color: 'var(--color-green-400)'}} size={32} />
            <h3 className={styles.infoCardTitle}>Privacy Protected</h3>
            <p className={styles.infoCardDescription}>Your content remains completely private</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
