import React, { createContext, useContext, useState, useEffect } from 'react';

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

interface SettingsContextType {
  settings: Settings;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
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

  return (
    <SettingsContext.Provider value={{ settings, updateSetting }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}