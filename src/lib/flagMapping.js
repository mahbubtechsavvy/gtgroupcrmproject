/**
 * Flag Mapping Utility
 * Maps country names to SVG flag file paths served from /public/country_flags/
 * Location: src/lib/flagMapping.js
 */

/**
 * Map of country names to SVG flag file paths
 * SVG files are located in /public/country_flags/ directory
 */
const countryToFlagMap = {
  // ── GT Group Office Countries (high-quality custom SVGs) ──────────────────
  'Bangladesh':  '/country_flags/bangladesh_flag.svg',
  'South Korea': '/country_flags/south-korea_flag.svg',
  'Sri Lanka':   '/country_flags/sri-lanka_flag.svg',
  'Vietnam':     '/country_flags/vietnam_flag.svg',

  // ── Study Abroad Destination Countries ────────────────────────────────────
  'Japan':          '/country_flags/japan_flag.svg',
  'USA':            '/country_flags/usa_flag.svg',
  'United States':  '/country_flags/usa_flag.svg',
  'UK':             '/country_flags/uk_flag.svg',
  'United Kingdom': '/country_flags/uk_flag.svg',
  'Britain':        '/country_flags/uk_flag.svg',
  'Australia':      '/country_flags/australia_flag.svg',
  'Germany':        '/country_flags/germany_flag.svg',
  'Finland':        '/country_flags/finland_flag.svg',
  'India':          '/country_flags/india_flag.svg',
  'Nepal':          '/country_flags/nepal_flag.svg',
  'Canada':         '/country_flags/canada_flag.svg',
  'Malaysia':       '/country_flags/malaysia_flag.svg',
  'China':          '/country_flags/china_flag.svg',

  // ── Lowercase / alternate-name fallbacks ──────────────────────────────────
  'bangladesh':     '/country_flags/bangladesh_flag.svg',
  'south korea':    '/country_flags/south-korea_flag.svg',
  'southkorea':     '/country_flags/south-korea_flag.svg',
  'korea':          '/country_flags/south-korea_flag.svg',
  'sri lanka':      '/country_flags/sri-lanka_flag.svg',
  'srilanka':       '/country_flags/sri-lanka_flag.svg',
  'vietnam':        '/country_flags/vietnam_flag.svg',
  'japan':          '/country_flags/japan_flag.svg',
  'usa':            '/country_flags/usa_flag.svg',
  'united states':  '/country_flags/usa_flag.svg',
  'uk':             '/country_flags/uk_flag.svg',
  'united kingdom': '/country_flags/uk_flag.svg',
  'britain':        '/country_flags/uk_flag.svg',
  'australia':      '/country_flags/australia_flag.svg',
  'germany':        '/country_flags/germany_flag.svg',
  'finland':        '/country_flags/finland_flag.svg',
  'india':          '/country_flags/india_flag.svg',
  'nepal':          '/country_flags/nepal_flag.svg',
  'canada':         '/country_flags/canada_flag.svg',
  'malaysia':       '/country_flags/malaysia_flag.svg',
  'china':          '/country_flags/china_flag.svg',
};

/**
 * Emoji fallbacks — used only in <select><option> dropdowns where
 * <img> cannot be rendered. Keep in sync with countryToFlagMap keys.
 */
const countryToEmojiMap = {
  'Bangladesh':     '🇧🇩',
  'South Korea':    '🇰🇷',
  'Sri Lanka':      '🇱🇰',
  'Vietnam':        '🇻🇳',
  'Japan':          '🇯🇵',
  'USA':            '🇺🇸',
  'United States':  '🇺🇸',
  'UK':             '🇬🇧',
  'United Kingdom': '🇬🇧',
  'Australia':      '🇦🇺',
  'Germany':        '🇩🇪',
  'Finland':        '🇫🇮',
  'India':          '🇮🇳',
  'Nepal':          '🇳🇵',
  'Canada':         '🇨🇦',
  'Malaysia':       '🇲🇾',
  'China':          '🇨🇳',
};

/**
 * Get the SVG flag path for a country.
 * @param {string} countryName
 * @returns {string|null} Path to SVG file or null if not found.
 */
export function getCountryFlagPath(countryName) {
  if (!countryName) return null;

  // Exact match
  if (countryToFlagMap[countryName]) return countryToFlagMap[countryName];

  // Case-insensitive match
  const lower = countryName.trim().toLowerCase();
  if (countryToFlagMap[lower]) return countryToFlagMap[lower];

  return null;
}

/**
 * Get the emoji flag for a country.
 * @param {string} countryName
 * @returns {string} Emoji flag or white flag fallback.
 */
export function getCountryFlagEmoji(countryName) {
  if (!countryName) return '🏳️';

  if (countryToEmojiMap[countryName]) return countryToEmojiMap[countryName];

  for (const [key, emoji] of Object.entries(countryToEmojiMap)) {
    if (key.toLowerCase() === countryName.toLowerCase()) return emoji;
  }

  return '🏳️';
}

/**
 * Get both SVG path and emoji for a country.
 * @param {string} countryName
 * @returns {{ svgPath: string|null, emoji: string }}
 */
export function getCountryFlags(countryName) {
  return {
    svgPath: getCountryFlagPath(countryName),
    emoji:   getCountryFlagEmoji(countryName),
  };
}

/**
 * Check if a country has an SVG flag available.
 * @param {string} countryName
 * @returns {boolean}
 */
export function hasCountryFlagSvg(countryName) {
  return getCountryFlagPath(countryName) !== null;
}

/**
 * Get all countries with available SVG flags (title-cased keys only).
 * @returns {string[]}
 */
export function getAvailableFlagCountries() {
  const countries = new Set();
  Object.keys(countryToFlagMap).forEach((country) => {
    if (country[0] === country[0].toUpperCase()) {
      countries.add(country);
    }
  });
  return Array.from(countries).sort();
}
