import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
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
  mode: 'light',
  preference: 'light',
  theme: colors.light,
  palette,
  brand: colors.brand,
  gradient: colors.gradient.light,
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
  const [preference, setPreferenceState] = useState<ThemePreference>('light');
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);

  useEffect(() => {
    const loadPreference = async () => {
      try {
        const saved = await getItem(StorageKeys.THEME_PREFERENCE);
        // Light-theme facelift: dark mode is retired. Honour a saved light
        // preference but ignore any legacy 'dark'/'system' value.
        if (saved === 'light') {
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

  // Light-theme facelift: the dual-mode plumbing is kept for easy rollback,
  // but the app is locked to light. `preference`/`systemColorScheme` no longer
  // influence the resolved mode.
  const mode: ColorMode = 'light';

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
