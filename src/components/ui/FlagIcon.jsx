'use client';

import React, { useState } from 'react';
import { getCountryFlagPath, getCountryFlagEmoji } from '@/lib/flagMapping';
import styles from './FlagIcon.module.css';

/**
 * FlagIcon Component
 * Displays a country flag as SVG image with emoji fallback
 * 
 * Props:
 * - destination: object with country_name, flag_path, flag_emoji (from DB)
 * - countryName: string (fallback if destination not provided)
 * - size: 'sm' | 'md' | 'lg' (default: 'md')
 * - showName: boolean (show country name next to flag) (default: false)
 * - className: string (additional CSS classes)
 */
export default function FlagIcon({
  destination,
  countryName,
  size = 'md',
  showName = false,
  className = '',
}) {
  const [imageError, setImageError] = useState(false);

  // Get country name from destination or prop
  const country = destination?.country_name || countryName;
  if (!country) return null;

  // Try to get flag path: first from destination.flag_path, then from mapping
  let flagPath = destination?.flag_path || getCountryFlagPath(country);
  const flagEmoji = destination?.flag_emoji || getCountryFlagEmoji(country) || '🏳️';

  // Sizes mapping
  const sizeMap = {
    sm: 24,
    md: 32,
    lg: 48,
  };
  const iconSize = sizeMap[size] || sizeMap.md;

  // CSS size class
  const sizeClass = `flag-${size}`;

  // Handle image loading error: fall back to emoji
  const handleImageError = () => {
    setImageError(true);
  };

  const containerClasses = `${styles.flagContainer} ${styles[sizeClass]} ${className}`;

  return (
    <div className={containerClasses} title={country}>
      {flagPath && !imageError ? (
        <img
          src={flagPath}
          alt={`${country} flag`}
          width={iconSize}
          height={iconSize}
          className={styles.flagImage}
          onError={handleImageError}
        />
      ) : (
        <span className={styles.flagEmoji} style={{ fontSize: `${iconSize}px` }}>
          {flagEmoji}
        </span>
      )}
      {showName && <span className={styles.countryName}>{country}</span>}
    </div>
  );
}
