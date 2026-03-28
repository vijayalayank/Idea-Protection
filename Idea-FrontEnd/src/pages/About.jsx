import React from 'react';
import { Shield, Users, Globe, Zap } from 'lucide-react';
import styles from './About.module.css';

const About = () => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            About{' '}
            <span className={styles.gradientText}>
              MuseChain
            </span>
          </h1>
          <p className={styles.description}>
            Revolutionizing intellectual property protection through blockchain technology and decentralized storage.
          </p>
        </div>

        {/* Mission Section */}
        <div className={styles.missionSection}>
          <div className={styles.missionCard}>
            <h2 className={styles.missionTitle}>Our Mission</h2>
            <p className={styles.missionText}>
              MuseChain empowers creators, inventors, and innovators to protect their intellectual property
              using cutting-edge blockchain technology. We believe that every idea deserves protection,
              and every creator should have access to affordable, secure, and immutable proof of ownership.
            </p>
          </div>
        </div>

        {/* Values Section */}
        <div className={styles.valuesGrid}>
          <div className={styles.valueCard}>
            <div className={`${styles.valueIcon} ${styles.valueIconPurple}`}>
              <Shield size={32} />
            </div>
            <h3 className={styles.valueTitle}>Security First</h3>
            <p className={styles.valueDescription}>
              Your intellectual property is protected by military-grade cryptography and blockchain immutability.
            </p>
          </div>

          <div className={styles.valueCard}>
            <div className={`${styles.valueIcon} ${styles.valueIconBlue}`}>
              <Users size={32} />
            </div>
            <h3 className={styles.valueTitle}>Community Driven</h3>
            <p className={styles.valueDescription}>
              Built by creators, for creators. Our platform evolves based on community needs and feedback.
            </p>
          </div>

          <div className={styles.valueCard}>
            <div className={`${styles.valueIcon} ${styles.valueIconGreen}`}>
              <Globe size={32} />
            </div>
            <h3 className={styles.valueTitle}>Global Access</h3>
            <p className={styles.valueDescription}>
              Accessible worldwide, breaking down barriers to intellectual property protection.
            </p>
          </div>

          <div className={styles.valueCard}>
            <div className={`${styles.valueIcon} ${styles.valueIconYellow}`}>
              <Zap size={32} />
            </div>
            <h3 className={styles.valueTitle}>Innovation</h3>
            <p className={styles.valueDescription}>
              Constantly pushing the boundaries of what's possible in IP protection technology.
            </p>
          </div>
        </div>

        {/* Technology Section */}
        <div className={styles.techSection}>
          <h2 className={styles.techTitle}>Our Technology Stack</h2>
          <div className={styles.techGrid}>
            <div className={styles.techItem}>
              <h3 className={styles.techItemTitle}>Blockchain</h3>
              <p className={styles.techItemDescription}>
                Immutable timestamps and ownership records stored on a decentralized blockchain network.
              </p>
            </div>
            <div className={styles.techItem}>
              <h3 className={styles.techItemTitle}>IPFS</h3>
              <p className={styles.techItemDescription}>
                Decentralized file storage ensuring your data is always accessible and cannot be censored.
              </p>
            </div>
            <div className={styles.techItem}>
              <h3 className={styles.techItemTitle}>Cryptography</h3>
              <p className={styles.techItemDescription}>
                Advanced cryptographic hashing to protect your ideas while proving ownership.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className={styles.ctaSection}>
          <h2 className={styles.ctaTitle}>Join the Revolution</h2>
          <p className={styles.ctaText}>
            Ready to protect your intellectual property with the power of blockchain?
            Join thousands of creators who trust MuseChain to secure their innovations.
          </p>
          <button className={styles.ctaButton}>
            Get Started Today
          </button>
        </div>
      </div>
    </div>
  );
};

export default About;
