import React from 'react';
import { Link } from 'react-router-dom';
import { Hash, Clock, Shield } from 'lucide-react';
import styles from './Home.module.css';

const Home = () => {
  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Protect Your{' '}
            <span className={styles.gradientText}>
              Intellectual Ideas
            </span>
          </h1>

          <p className={styles.heroDescription}>
            Store cryptographic hashes of your intellectual property on the
            blockchain with immutable timestamps. Prove ownership and
            protect your innovations.
          </p>

          <div className={styles.buttonContainer}>
            <Link
              to="/register"
              className={styles.btnPrimary}
            >
              Register Your Idea
            </Link>
            <Link
              to="/registry"
              className={styles.btnSecondary}
            >
              View Registry
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.featuresSection}>
        <div className={styles.featuresContainer}>
          <div className={styles.featuresGrid}>
            {/* Cryptographic Hash */}
            <div className={styles.featureCard}>
              <div className={`${styles.featureIcon} ${styles.featureIconPurple}`}>
                <Hash style={{color: 'white'}} size={32} />
              </div>
              <h3 className={styles.featureTitle}>Cryptographic Hash</h3>
              <p className={styles.featureDescription}>
                Generate unique hashes that represent your ideas without revealing content
              </p>
            </div>

            {/* Immutable Timestamp */}
            <div className={styles.featureCard}>
              <div className={`${styles.featureIcon} ${styles.featureIconBlue}`}>
                <Clock style={{color: 'white'}} size={32} />
              </div>
              <h3 className={styles.featureTitle}>Immutable Timestamp</h3>
              <p className={styles.featureDescription}>
                Blockchain verified timestamps that can't be altered or disputed
              </p>
            </div>

            {/* Secure & Private */}
            <div className={styles.featureCard}>
              <div className={`${styles.featureIcon} ${styles.featureIconGreen}`}>
                <Shield style={{color: 'white'}} size={32} />
              </div>
              <h3 className={styles.featureTitle}>Secure & Private</h3>
              <p className={styles.featureDescription}>
                Your ideas remain private while still being provably yours
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
