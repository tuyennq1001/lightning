import { useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import type { UserSettings } from '../utils/storage';

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial load
    storage.getSettings().then((data) => {
      setSettings(data);
      setLoading(false);
    });

    // Listen for changes
    const unsubscribe = storage.onSettingsChanged((newSettings) => {
      setSettings(newSettings);
    });

    return () => unsubscribe();
  }, []);

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    await storage.saveSettings(newSettings);
  };

  return { settings, updateSettings, loading };
}
