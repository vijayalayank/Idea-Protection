import React, { useState, useEffect } from 'react';
import { Shield, Lock, Unlock, Eye, FileText, Clock, ExternalLink } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import ideaRegistrationService from '../services/ideaRegistrationService';
import styles from './MyIdeas.module.css';

const MyIdeas = () => {
    const { account, servicesReady } = useWallet();
    const [ideas, setIdeas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [unlockModal, setUnlockModal] = useState({ show: false, ideaId: null });
    const [password, setPassword] = useState('');
    const [unlocking, setUnlocking] = useState(false);

    useEffect(() => {
        if (servicesReady && account) {
            fetchMyIdeas();
        } else {
            setLoading(false);
        }
    }, [servicesReady, account]);

    const fetchMyIdeas = async () => {
        try {
            setLoading(true);
            setError(null);
            const userIdeas = await ideaRegistrationService.getUserIdeas();
            setIdeas(userIdeas);
        } catch (err) {
            console.error('Error fetching my ideas:', err);
            setError('Failed to load your ideas. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleUnlockClick = (ideaId) => {
        setUnlockModal({ show: true, ideaId });
        setPassword('');
    };

    const handleUnlockSubmit = async (e) => {
        e.preventDefault();
        if (!password) return;

        setUnlocking(true);
        try {
            // Call service to decrypt details
            const decryptedIdea = await ideaRegistrationService.getIdeaDetails(unlockModal.ideaId, password);

            // Update local state with decrypted idea
            setIdeas(prev => prev.map(idea =>
                idea.id === unlockModal.ideaId ? { ...decryptedIdea, isUnlocked: true } : idea
            ));

            setUnlockModal({ show: false, ideaId: null });
        } catch (err) {
            alert('Incorrect password. Please try again.');
        } finally {
            setUnlocking(false);
        }
    };

    if (!account) {
        return (
            <div className={styles.container}>
                <div className={styles.connectWallet}>
                    <Shield size={64} className={styles.icon} />
                    <h2>Connect Wallet</h2>
                    <p>Please connect your wallet to view your registered ideas.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>My <span className={styles.gradientText}>Ideas</span></h1>
                <p>Manage and view your registered intellectual property.</p>
            </div>

            {loading ? (
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading your portfolio...</p>
                </div>
            ) : error ? (
                <div className={styles.error}>{error}</div>
            ) : ideas.length === 0 ? (
                <div className={styles.emptyState}>
                    <FileText size={48} />
                    <h3>No Ideas Registered Yet</h3>
                    <p>Start by registering your first idea to see it here.</p>
                    <a href="/register" className={styles.linkButton}>Register Idea</a>
                </div>
            ) : (
                <div className={styles.grid}>
                    {ideas.map(idea => (
                        <div key={idea.id} className={`${styles.card} ${idea.isPrivate ? styles.privateCard : ''}`}>
                            <div className={styles.cardHeader}>
                                <div className={styles.statusBadge}>
                                    {idea.isPrivate ? (
                                        idea.isUnlocked ? <><Unlock size={14} /><span>Unlocked</span></> : <><Lock size={14} /><span>Private</span></>
                                    ) : (
                                        <><Eye size={14} /><span>Public</span></>
                                    )}
                                </div>
                                <span className={styles.timestamp}>
                                    <Clock size={14} /> {new Date(idea.timestamp).toLocaleDateString()}
                                </span>
                            </div>

                            <h3 className={styles.cardTitle}>{idea.title}</h3>

                            <div className={styles.cardBody}>
                                {idea.isPrivate && !idea.isUnlocked ? (
                                    <div className={styles.lockedContent}>
                                        <Lock size={32} />
                                        <p>This content is password protected.</p>
                                        <button
                                            className={styles.unlockBtn}
                                            onClick={() => handleUnlockClick(idea.id)}
                                        >
                                            Unlock to View
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <p className={styles.description}>{idea.description}</p>
                                        {idea.tags && (
                                            <div className={styles.tags}>
                                                {idea.tags.map((tag, i) => <span key={i} className={styles.tag}>#{tag}</span>)}
                                            </div>
                                        )}
                                        <div className={styles.links}>
                                            <a href={idea.ipfsUrl} target="_blank" rel="noopener noreferrer" className={styles.actionLink}>
                                                View IPFS Metadata <ExternalLink size={12} />
                                            </a>
                                            <a href={idea.explorerUrl} target="_blank" rel="noopener noreferrer" className={styles.actionLink}>
                                                View Transaction <ExternalLink size={12} />
                                            </a>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Password Modal */}
            {unlockModal.show && (
                <div className={styles.modalOverlay} onClick={() => setUnlockModal({ show: false, ideaId: null })}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <h3>Unlock Private Idea</h3>
                        <p>Enter your password to decrypt this idea.</p>
                        <form onSubmit={handleUnlockSubmit}>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Enter password..."
                                className={styles.passwordInput}
                                autoFocus
                            />
                            <div className={styles.modalActions}>
                                <button type="button" onClick={() => setUnlockModal({ show: false, ideaId: null })} className={styles.cancelBtn}>Cancel</button>
                                <button type="submit" disabled={unlocking} className={styles.confirmBtn}>
                                    {unlocking ? 'Unlocking...' : 'Unlock'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyIdeas;
