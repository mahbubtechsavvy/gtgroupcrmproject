'use client';

import { X, MessageCircle, Smartphone, Info } from 'lucide-react';
import styles from './WhatsAppPanel.module.css';

export default function WhatsAppPanel({ account, onClose }) {
  if (!account) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.panelHeader}>
        <div className={styles.title}>
          <MessageCircle size={20} style={{ color: '#25D366' }} />
          <span>WhatsApp Web Command Center</span>
          <span className={styles.officeName}>{account.offices?.name}</span>
        </div>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close panel">
          <X size={20} />
        </button>
      </div>

      <div className={styles.frameWrapper}>
        <iframe 
          src="https://web.whatsapp.com" 
          className={styles.frame}
          title="WhatsApp Web"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        />
      </div>

      <div className={styles.hint}>
        <Smartphone size={16} />
        <span>First time? Open WhatsApp on your phone → Settings → Linked Devices → Link a Device → Scan QR code above</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.8 }}>
          <Info size={14} />
          <span style={{ fontSize: '11px' }}>Linked devices remain active even if phone is offline</span>
        </div>
      </div>
    </div>
  );
}
