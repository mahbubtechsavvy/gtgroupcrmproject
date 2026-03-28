'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, getRoleLabel } from '@/lib/auth';
import { isSuperAdmin } from '@/lib/permissions';
import styles from './Header.module.css';

export default function Header({ user, sidebarCollapsed }) {
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  const superAdmin = isSuperAdmin(user?.role);

  return (
    <header
      className={styles.header}
      style={{ left: sidebarCollapsed ? '72px' : 'var(--sidebar-width)' }}
    >
      {/* Left: Page info */}
      <div className={styles.left}>
        {user && (
          <div className={styles.officeTag}>
            {superAdmin ? (
              <span className={styles.superBadge}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                Super Admin
              </span>
            ) : (
              <span className={styles.officeName}>
                🏢 {user.offices?.name || 'Office'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className={styles.right}>
        {/* Quick add */}
        <button
          className={`btn btn-primary btn-sm ${styles.addBtn}`}
          onClick={() => router.push('/students?action=add')}
          id="header-add-student-btn"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Student
        </button>

        {/* Notifications */}
        <div className={styles.notifWrapper}>
          <button
            className={styles.iconBtn}
            onClick={() => setNotifOpen(!notifOpen)}
            id="header-notifications-btn"
            aria-label="Notifications"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className={styles.notifDot} />
          </button>

          {notifOpen && (
            <div className={styles.notifDropdown}>
              <div className={styles.dropdownHeader}>
                <span>Notifications</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setNotifOpen(false)}>
                  Clear all
                </button>
              </div>
              <div className={styles.notifEmpty}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.3 }}>
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                </svg>
                <p>No new notifications</p>
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className={styles.userMenu}>
          <button
            className={styles.userBtn}
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            id="header-user-menu-btn"
          >
            <div className={styles.avatar}>
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={user?.full_name} />
              ) : (
                user?.full_name?.charAt(0)?.toUpperCase() || 'U'
              )}
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user?.full_name || 'User'}</span>
              <span className={styles.userRole}>{getRoleLabel(user?.role)}</span>
            </div>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ transform: userMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {userMenuOpen && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownUser}>
                <p className={styles.dropdownName}>{user?.full_name}</p>
                <p className={styles.dropdownEmail}>{user?.email}</p>
              </div>
              <div className={styles.dropdownItems}>
                <button className={styles.dropdownItem} onClick={() => { router.push('/settings'); setUserMenuOpen(false); }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0" />
                  </svg>
                  Settings
                </button>
                <div className={styles.dropdownDivider} />
                <button className={styles.dropdownItem + ' ' + styles.signoutItem} onClick={handleSignOut}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
