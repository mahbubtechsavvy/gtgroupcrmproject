'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from '@/lib/auth';
import { useLoginPageSettings } from '@/lib/useAppSettings';
import styles from './login.module.css';

// Office badge SVG flag data – must match /public/country_flags/
const OFFICE_BADGES = [
  { country: 'Bangladesh', flagSrc: '/country_flags/bangladesh_flag.svg' },
  { country: 'South Korea', flagSrc: '/country_flags/south-korea_flag.svg' },
  { country: 'Sri Lanka',   flagSrc: '/country_flags/sri-lanka_flag.svg'   },
  { country: 'Vietnam',     flagSrc: '/country_flags/vietnam_flag.svg'      },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const loginSettings = useLoginPageSettings();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error: authError } = await signIn(email, password);

    if (authError) {
      setError(authError.message || 'Invalid credentials. Please try again.');
      setLoading(false);
      return;
    }

    if (data?.session) {
      window.location.href = '/dashboard';
    }
  };

  return (
    <div className={styles.loginPage}>
      {/* Background */}
      <div className={styles.bgDecor}>
        <div className={styles.bgOrb1} />
        <div className={styles.bgOrb2} />
        <div className={styles.bgGrid} />
      </div>

      <div className={styles.loginContainer}>
        {/* Brand */}
        <div className={styles.brandSection}>
          {loginSettings.logoUrl ? (
            // Display actual logo if available — sourced from General Settings
            <div className={styles.logoBrand}>
              <img
                src={`${loginSettings.logoUrl}?v=${loginSettings.logoVersion || '1'}`}
                alt="Company Logo"
                className={styles.logoImage}
              />
            </div>
          ) : (
            // Display GT mark if no logo yet
            <div className={styles.logoMark}>
              <span>GT</span>
            </div>
          )}
          <div>
            <h1 className={styles.brandName}>{loginSettings.companyName}</h1>
            <p className={styles.brandTagline}>{loginSettings.slogan}</p>
          </div>
        </div>

        {/* Login Card */}
        <div className={styles.loginCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Welcome back</h2>
            <p className={styles.cardSubtitle}>Sign in to your CRM workspace</p>
          </div>

          {error && (
            <div className={styles.errorAlert}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.loginForm}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <div className={styles.inputWrapper}>
                <svg className={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <input
                  id="email"
                  type="email"
                  className={`form-input ${styles.loginInput}`}
                  placeholder="your.email@gtgroup.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div className={styles.inputWrapper}>
                <svg className={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`form-input ${styles.loginInput}`}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="loading-spinner" style={{ width: '18px', height: '18px' }} />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className={styles.cardFooter}>
            <p className={styles.footerNote}>
              Contact your IT Administrator to reset your password or create an account.
            </p>
          </div>
        </div>

        {/* Office Badges — SVG flags */}
        <div className={styles.officeBadges}>
          {OFFICE_BADGES.map(({ country, flagSrc }) => (
            <span key={country} className={styles.officeBadge}>
              <img
                src={flagSrc}
                alt={`${country} flag`}
                className={styles.officeBadgeFlag}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              {country}
            </span>
          ))}
        </div>

        <p className={styles.copyright}>© {new Date().getFullYear()} GT Group Study Abroad Consultancy</p>
      </div>
    </div>
  );
}
