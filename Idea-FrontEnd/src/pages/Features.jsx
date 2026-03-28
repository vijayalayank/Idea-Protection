import React from 'react';
import { Hash, Clock, Shield, Database, Lock, Zap } from 'lucide-react';
import styles from './Features.module.css';

const Features = () => {
  const features = [
    {
      icon: Hash,
      title: 'Cryptographic Hashing',
      description: 'Generate SHA-256 hashes of your intellectual property without revealing the actual content.',
      details: ['Secure one-way encryption', 'Content remains private', 'Unique fingerprint generation']
    },
    {
      icon: Clock,
      title: 'Immutable Timestamps',
      description: 'Blockchain-verified timestamps that provide undeniable proof of when your idea was registered.',
      details: ['Blockchain verification', 'Cannot be altered', 'Legal proof of priority']
    },
    {
      icon: Shield,
      title: 'Privacy Protection',
      description: 'Your ideas remain completely private while still being provably yours.',
      details: ['Zero-knowledge proofs', 'Content never exposed', 'Ownership verification']
    },
    {
      icon: Database,
      title: 'IPFS Storage',
      description: 'Decentralized storage ensures your data is always accessible and cannot be censored.',
      details: ['Distributed storage', 'No single point of failure', 'Permanent availability']
    },
    {
      icon: Lock,
      title: 'Secure Authentication',
      description: 'Wallet-based authentication ensures only you can manage your intellectual property.',
      details: ['Cryptographic signatures', 'No passwords needed', 'Self-sovereign identity']
    },
    {
      icon: Zap,
      title: 'Instant Verification',
      description: 'Quickly verify the authenticity and timestamp of any registered idea.',
      details: ['Real-time verification', 'Public registry access', 'Transparent process']
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            Platform{' '}
            <span className={styles.gradientText}>
              Features
            </span>
          </h1>
          <p className={styles.description}>
            Discover the powerful features that make MuseChain the most secure and reliable platform for protecting your intellectual property.
          </p>
        </div>

        <div className={styles.featuresGrid}>
          {features.map((feature, index) => (
            <div key={index} className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <feature.icon size={32} />
              </div>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDescription}>{feature.description}</p>
              <ul className={styles.featureDetails}>
                {feature.details.map((detail, detailIndex) => (
                  <li key={detailIndex} className={styles.featureDetail}>
                    <div className={styles.detailBullet}></div>
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Features;
