import React, { useCallback, useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { View } from 'react-native';

import { ThemeProvider, useTheme } from './src/theme';
import { AuthProvider } from './src/providers/AuthProvider';
import { AppNavigator } from './src/navigation/AppNavigator';

SplashScreen.preventAutoHideAsync();

function AppShell({ onLayout }: { onLayout: () => void }) {
  const { mode, theme } = useTheme();

  const navigationTheme = useMemo(() => {
    const baseTheme = mode === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        primary: theme.secondary.main,
        background: theme.background.default,
        card: theme.background.default,
        text: theme.text.primary,
        border: theme.divider,
        notification: theme.error.main,
      },
    };
  }, [mode, theme]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background.default }} onLayout={onLayout}>
      <NavigationContainer theme={navigationTheme}>
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
        <AppNavigator />
      </NavigationContainer>
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <ThemeProvider>
        <AppShell onLayout={onLayoutRootView} />
      </ThemeProvider>
    </AuthProvider>
  );
}
