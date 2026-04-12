'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase';

/**
 * Hook to fetch and manage app settings from Supabase
 * Converts key-value pairs from app_settings table into an object
 * 
 * Usage:
 * const appSettings = useAppSettings();
 * console.log(appSettings.company_name);
 * console.log(appSettings.logo_url);
 * 
 * Returns: { [key]: value } or null if loading
 */
export function useAppSettings() {
  const [appSettings, setAppSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = getSupabaseClient();

      // Fetch all settings
      const { data, error: fetchError } = await supabase
        .from('app_settings')
        .select('key, value');

      if (fetchError) throw fetchError;

      // Convert array of { key, value } to object { key: value }
      const settingsMap = {};
      if (data && Array.isArray(data)) {
        data.forEach((item) => {
          settingsMap[item.key] = item.value;
        });
      }

      // Add a client-side version for cache busting
      settingsMap._version = Date.now();

      setAppSettings(settingsMap);
    } catch (err) {
      console.error('Error fetching app settings:', err);
      setError(err.message);
      // Set sensible defaults even on error
      setAppSettings({
        company_name: 'GT Group',
        login_page_company_name: 'GT Group',
        login_page_company_slogan: 'Study Abroad Consultancy',
        use_svg_flags: 'true',
        _version: Date.now(),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return appSettings;
}

/**
 * Hook to fetch a single setting value
 * 
 * Usage:
 * const companyName = useAppSetting('company_name');
 */
export function useAppSetting(key) {
  const appSettings = useAppSettings();
  return appSettings?.[key] || null;
}

/**
 * Hook to fetch multiple specific settings
 * 
 * Usage:
 * const { company_name, logo_url } = useAppSettings(['company_name', 'logo_url']);
 */
export function useAppSettingsMultiple(keysArray) {
  const appSettings = useAppSettings();

  if (!appSettings) return {};

  const result = {};
  keysArray.forEach((key) => {
    result[key] = appSettings[key];
  });

  return result;
}

/**
 * Hook to get login page specific settings
 * Uses sensible defaults if settings not found
 * 
 * Usage:
 * const loginSettings = useLoginPageSettings();
 * console.log(loginSettings.companyName);
 * console.log(loginSettings.slogan);
 * console.log(loginSettings.logoUrl);
 * console.log(loginSettings.logoVersion);
 */
export function useLoginPageSettings() {
  const appSettings = useAppSettings();

  if (!appSettings) {
    return {
      companyName: 'GT Group',
      slogan: 'Study Abroad Consultancy',
      logoUrl: null,
      logoVersion: Date.now(),
      loading: true,
    };
  }

  return {
    companyName:
      appSettings.login_page_company_name ||
      appSettings.company_name ||
      'GT Group',
    slogan:
      appSettings.login_page_company_slogan ||
      'Study Abroad Consultancy',
    logoUrl: appSettings.logo_url || null,
    logoVersion: appSettings._version || Date.now(),
    loading: false,
  };
}
