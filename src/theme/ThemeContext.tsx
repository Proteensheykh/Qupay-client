import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { colors, ColorMode, ThemeColors } from './colors';

interface ThemeContextType {
  mode: ColorMode;
  theme: ThemeColors;
  brand: typeof colors.brand;
  gradient: typeof colors.gradient;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'dark',
  theme: colors.dark,
  brand: colors.brand,
  gradient: colors.gradient,
  toggleMode: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ColorMode>('dark');

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const value = useMemo(
    () => ({
      mode,
      theme: colors[mode],
      brand: colors.brand,
      gradient: colors.gradient,
      toggleMode,
    }),
    [mode, toggleMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
