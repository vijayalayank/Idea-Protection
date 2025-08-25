import React from 'react';
import { Github, Twitter, Mail } from 'lucide-react';
import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.content}>
          {/* Brand Section */}
          <div className={styles.brandSection}>
            <div className={styles.brand}>
              <div className={styles.logoIcon}>
                <span style={{color: 'white', fontWeight: 'bold', fontSize: '0.875rem'}}>M</span>
              </div>
              <span className={styles.brandName}>MuseChain</span>
            </div>
            <p className={styles.brandDescription}>
              Protecting intellectual property on the blockchain with immutable 
              timestamps and cryptographic proof.
            </p>
          </div>

          {/* Platform Links */}
          <div className={styles.linkSection}>
            <h3 className={styles.sectionTitle}>Platform</h3>
            <ul className={styles.linkList}>
              <li>
                <a href="#" className={styles.link}>How it Works</a>
              </li>
              <li>
                <a href="#" className={styles.link}>Security</a>
              </li>
              <li>
                <a href="#" className={styles.link}>API Documentation</a>
              </li>
              <li>
                <a href="#" className={styles.link}>Pricing</a>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className={styles.linkSection}>
            <h3 className={styles.sectionTitle}>Legal</h3>
            <ul className={styles.linkList}>
              <li>
                <a href="#" className={styles.link}>Terms of Service</a>
              </li>
              <li>
                <a href="#" className={styles.link}>Privacy Policy</a>
              </li>
              <li>
                <a href="#" className={styles.link}>Cookie Policy</a>
              </li>
              <li>
                <a href="#" className={styles.link}>GDPR Compliance</a>
              </li>
            </ul>
          </div>

          {/* Connect Section */}
          <div className={styles.linkSection}>
            <h3 className={styles.sectionTitle}>Connect</h3>
            <div className={styles.socialLinks}>
              <a href="#" className={styles.socialLink} aria-label="GitHub">
                <Github size={20} />
              </a>
              <a href="#" className={styles.socialLink} aria-label="Twitter">
                <Twitter size={20} />
              </a>
              <a href="#" className={styles.socialLink} aria-label="Email">
                <Mail size={20} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
