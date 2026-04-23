import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import { useColorScheme } from 'react-native';
import { colors, palette, ColorMode, ThemeColors } from './colors';
import { gradients } from './gradients';
import { radii } from './radii';
import { shadows, borders, innerBorders, getCardElevation } from './elevation';
import { durations, easings, springs, pressAnimation } from './motion';
import { getItem, setItem, StorageKeys } from '../store/secureStorage';

export type ThemePreference = 'system' | 'light' | 'dark';

type GradientColors = typeof colors.gradient.light | typeof colors.gradient.dark;

interface ThemeContextType {
  mode: ColorMode;
  preference: ThemePreference;
  theme: ThemeColors;
  palette: typeof palette;
  brand: typeof colors.brand;
  gradient: GradientColors;
  gradients: typeof gradients;
  radii: typeof radii;
  shadows: typeof shadows;
  borders: typeof borders;
  /** @deprecated Use borders.hairline.dark instead */
  innerBorders: typeof innerBorders;
  motion: {
    durations: typeof durations;
    easings: typeof easings;
    springs: typeof springs;
    pressAnimation: typeof pressAnimation;
  };
  getCardElevation: typeof getCardElevation;
  setPreference: (pref: ThemePreference) => void;
  isThemeLoaded: boolean;
}

const defaultMotion = {
  durations,
  easings,
  springs,
  pressAnimation,
};

const ThemeContext = createContext<ThemeContextType>({
  mode: 'dark',
  preference: 'system',
  theme: colors.dark,
  palette,
  brand: colors.brand,
  gradient: colors.gradient.dark,
  gradients,
  radii,
  shadows,
  borders,
  innerBorders,
  motion: defaultMotion,
  getCardElevation,
  setPreference: () => {},
  isThemeLoaded: false,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
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
      palette,
      brand: colors.brand,
      gradient: colors.gradient[mode],
      gradients,
      radii,
      shadows,
      borders,
      innerBorders,
      motion: defaultMotion,
      getCardElevation,
      setPreference,
      isThemeLoaded,
    }),
    [mode, preference, setPreference, isThemeLoaded]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
