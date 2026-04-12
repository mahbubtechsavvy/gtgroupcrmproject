'use client';

import { 
  Facebook, Instagram, Youtube, Linkedin, Twitter, MessageCircle, 
  ExternalLink, Layout, BarChart, Send, Globe, Play, ShieldAlert 
} from 'lucide-react';
import styles from './PlatformCard.module.css';

const PLATFORM_ICONS = {
  facebook: <Facebook size={24} />,
  instagram: <Instagram size={24} />,
  tiktok: <Send size={24} />, // Lucide doesn't have TikTok, Send is a common fallback
  youtube: <Youtube size={24} />,
  linkedin: <Linkedin size={24} />,
  twitter: <Twitter size={24} />,
  whatsapp: <MessageCircle size={24} />,
  custom: <Globe size={24} />
};

export default function PlatformCard({ account, isAdmin, onWhatsAppOpen, lastPost }) {
  const { platform, account_name, page_url, mgmt_url, is_active, offices } = account;
  
  const icon = PLATFORM_ICONS[platform] || PLATFORM_ICONS.custom;
  const platformClass = styles[platform] || styles.custom;

  return (
    <div className={styles.card}>
      {!is_active && (
        <div className={styles.inactiveOverlay}>
          <span className={styles.inactiveBadge}>Inactive</span>
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div className={`${styles.iconWrapper} ${platformClass}`}>
          {icon}
        </div>
        <div className={styles.accountInfo}>
          <div className={styles.platformName}>{platform}</div>
          <div className={styles.accountName} title={account_name}>{account_name}</div>
          {isAdmin && offices?.name && (
            <div className={styles.officeTag}>{offices.name}</div>
          )}
        </div>
      </div>

      {/* Content / Last Post Preview */}
      <div className={styles.content}>
        {lastPost ? (
          <div className={styles.lastPost}>
            <div className={styles.postHeader}>
              <span className={styles.postTitle}>LATEST POST</span>
              <span className={styles.postDate}>
                {new Date(lastPost.posted_at).toLocaleDateString()}
              </span>
            </div>
            <p className={styles.description}>{lastPost.post_description}</p>
          </div>
        ) : (
          <div className={styles.lastPost} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80px', opacity: 0.5 }}>
            <p style={{ fontSize: '12px' }}>No recent updates logged</p>
          </div>
        )}
      </div>

      {/* Footer / Actions */}
      <div className={styles.footer}>
        {isAdmin ? (
          <>
            {platform === 'whatsapp' ? (
              <button 
                className={`${styles.launchBtn} ${styles.launchBtnPrimary}`}
                onClick={() => onWhatsAppOpen(account)}
              >
                <MessageCircle size={16} />
                Open WhatsApp
              </button>
            ) : (
              <>
                <a 
                  href={page_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={`${styles.launchBtn} ${styles.launchBtnPrimary}`}
                >
                  <ExternalLink size={16} />
                  Open Page
                </a>
                {mgmt_url && (
                  <a 
                    href={mgmt_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className={styles.launchBtn}
                  >
                    <Layout size={16} />
                    Management
                  </a>
                )}
              </>
            )}
          </>
        ) : (
          <a 
            href={page_url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className={`${styles.launchBtn} ${styles.launchBtnPrimary}`}
            style={{ width: '100%' }}
          >
            <ExternalLink size={16} />
            Visit Page
          </a>
        )}
      </div>
    </div>
  );
}
