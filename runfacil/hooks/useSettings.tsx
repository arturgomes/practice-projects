import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors, ThemeMode, Colors } from '@/constants/theme';

type Settings = {
  themeMode: ThemeMode;
  weightKg: number;
  distanceUnit: 'km' | 'mi';
  audioCuesEnabled: boolean;
  audioCueVolume: number;
  pairedDeviceId: string | null;
};

const defaultSettings: Settings = {
  themeMode: 'system',
  weightKg: 70,
  distanceUnit: 'km',
  audioCuesEnabled: true,
  audioCueVolume: 0.8,
  pairedDeviceId: null,
};

const STORAGE_KEY = '@runfacil/settings';

type SettingsContextType = {
  settings: Settings;
  colors: Colors;
  isDark: boolean;
  updateSettings: (partial: Partial<Settings>) => void;
};

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setSettings({ ...defaultSettings, ...JSON.parse(raw) });
    });
  }, []);

  const updateSettings = (partial: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const isDark =
    settings.themeMode === 'dark' ||
    (settings.themeMode === 'system' && systemScheme === 'dark');

  const colors: Colors = isDark ? darkColors : lightColors;

  return (
    <SettingsContext.Provider value={{ settings, colors, isDark, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
