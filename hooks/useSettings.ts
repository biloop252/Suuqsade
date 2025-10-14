'use client';

import { useState, useEffect } from 'react';
import { SystemSetting } from '@/types/database';

interface UseSettingsReturn {
  settings: SystemSetting[];
  loading: boolean;
  error: string | null;
  getSetting: (key: string) => string | null;
  getPublicSettings: () => Record<string, string>;
  refreshSettings: () => Promise<void>;
}

export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/settings');
      const data = await response.json();
      
      if (data.settings) {
        setSettings(data.settings);
      } else {
        setError('Failed to fetch settings');
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const getSetting = (key: string): string | null => {
    const setting = settings.find(s => s.setting_key === key);
    return setting?.setting_value || null;
  };

  const getPublicSettings = (): Record<string, string> => {
    const publicSettings: Record<string, string> = {};
    settings
      .filter(s => s.is_public)
      .forEach(s => {
        publicSettings[s.setting_key] = s.setting_value || '';
      });
    return publicSettings;
  };

  const refreshSettings = async () => {
    await fetchSettings();
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    error,
    getSetting,
    getPublicSettings,
    refreshSettings
  };
}

// Hook for accessing public settings only (for frontend use)
export function usePublicSettings() {
  const [publicSettings, setPublicSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/admin/settings?public=true');
        const data = await response.json();
        
        if (data.settings) {
          const settings: Record<string, string> = {};
          data.settings.forEach((setting: SystemSetting) => {
            settings[setting.setting_key] = setting.setting_value || '';
          });
          setPublicSettings(settings);
        } else {
          setError('Failed to fetch public settings');
        }
      } catch (err) {
        console.error('Error fetching public settings:', err);
        setError('Failed to fetch public settings');
      } finally {
        setLoading(false);
      }
    };

    fetchPublicSettings();
  }, []);

  return {
    settings: publicSettings,
    loading,
    error
  };
}

// Utility functions for common settings
export const getAppName = (settings: Record<string, string>) => settings.app_name || 'Suuqsade Marketplace';
export const getAppDescription = (settings: Record<string, string>) => settings.app_description || 'A modern e-commerce marketplace platform';
export const getAppTagline = (settings: Record<string, string>) => settings.app_tagline || 'Your trusted marketplace';
export const getContactEmail = (settings: Record<string, string>) => settings.contact_email || 'support@suuqsade.com';
export const getPhoneNumber = (settings: Record<string, string>) => settings.phone_number || '+1-555-0123';
export const getDefaultCurrency = (settings: Record<string, string>) => settings.default_currency || 'USD';
export const getMetaTitle = (settings: Record<string, string>) => settings.meta_title || 'Suuqsade Marketplace - Your Trusted Online Store';
export const getMetaDescription = (settings: Record<string, string>) => settings.meta_description || 'Discover amazing products at Suuqsade Marketplace. Quality items, great prices, and excellent service.';
