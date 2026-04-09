import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { colors, ColorMode, ThemeColors } from './colors';
import { getItem, setItem, StorageKeys } from '../store/secureStorage';

export type ThemePreference = 'system' | 'light' | 'dark';

type GradientColors = typeof colors.gradient.light | typeof colors.gradient.dark;

interface ThemeContextType {
  mode: ColorMode;
  preference: ThemePreference;
  theme: ThemeColors;
  brand: typeof colors.brand;
  gradient: GradientColors;
  setPreference: (pref: ThemePreference) => void;
  isThemeLoaded: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'dark',
  preference: 'system',
  theme: colors.dark,
  brand: colors.brand,
  gradient: colors.gradient.dark,
  setPreference: () => {},
  isThemeLoaded: false,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('dark');
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);

  useEffect(() => {
    const loadPreference = async () => {
      try {
        const saved = await getItem(StorageKeys.THEME_PREFERENCE);
        if (saved === 'system' || saved === 'light' || saved === 'dark') {
          setPreferenceState(saved);
        }
      } catch {
        // Use default if loading fails
      } finally {
        setIsThemeLoaded(true);
      }
    };
    loadPreference();
  }, []);

  const setPreference = useCallback(async (pref: ThemePreference) => {
    setPreferenceState(pref);
    try {
      await setItem(StorageKeys.THEME_PREFERENCE, pref);
    } catch {
      // Silently fail if storage fails
    }
  }, []);

  const mode: ColorMode = useMemo(() => {
    if (preference === 'system') {
      return systemColorScheme === 'light' ? 'light' : 'dark';
    }
    return preference;
  }, [preference, systemColorScheme]);

  const value = useMemo(
    () => ({
      mode,
      preference,
      theme: colors[mode],
      brand: colors.brand,
      gradient: colors.gradient[mode],
      setPreference,
      isThemeLoaded,
    }),
    [mode, preference, setPreference, isThemeLoaded]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
