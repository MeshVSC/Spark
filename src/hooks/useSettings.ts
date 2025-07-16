import { useState, useEffect } from 'react';

interface Settings {
  showViewCounts: boolean;
  showProjectCounts: boolean;
  showProjectDropdowns: boolean;
  moveCompletedToLogbook: 'immediately' | 'after1day' | 'after1week' | 'never';
  badgeCount: 'today' | 'inbox' | 'all' | 'none';
  groupTodosByProject: boolean;
  smartTimeGrouping: boolean;
  preserveWindowWidth: boolean;
  showEmptyTimePeriods: boolean;
}

const defaultSettings: Settings = {
  showViewCounts: true,
  showProjectCounts: true,
  showProjectDropdowns: true,
  moveCompletedToLogbook: 'immediately',
  badgeCount: 'today',
  groupTodosByProject: true,
  smartTimeGrouping: false,
  preserveWindowWidth: true,
  showEmptyTimePeriods: false,
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('spark-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (error) {
        console.error('Error parsing saved settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('spark-settings', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return {
    settings,
    updateSetting,
  };
}