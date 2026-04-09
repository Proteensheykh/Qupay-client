import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '../components/Icon';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../theme';
import type { InitiateRegistrationRequest, UserRole } from '../types/auth';

// Screens
import { SplashScreen } from '../screens/onboarding/SplashScreen';
import { SignUpScreen } from '../screens/onboarding/SignUpScreen';
import { SignInScreen } from '../screens/onboarding/SignInScreen';
import { OTPScreen } from '../screens/onboarding/OTPScreen';
import { PinSetupScreen } from '../screens/onboarding/PinSetupScreen';
import { PinVerifyScreen } from '../screens/onboarding/PinVerifyScreen';
import { PinResetScreen } from '../screens/onboarding/PinResetScreen';
import { ForgotPasswordScreen } from '../screens/onboarding/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../screens/onboarding/ResetPasswordScreen';

export interface DestInfo {
  flag: string;
  name: string;
  code: string;
  symbol: string;
  rate: number;
  providers: string;
}
import { HistoryScreen } from '../screens/portfolio/PortfolioScreen';
import { TransactionDetailScreen } from '../screens/transaction/TransactionDetailScreen';
import { ProfileScreen } from '../screens/settings/SettingsScreen';
import { RecipientScreen } from '../screens/send/RecipientScreen';
import { AmountScreen } from '../screens/send/AmountScreen';
import { ConfirmScreen } from '../screens/send/ConfirmScreen';
import { DepositWaitingScreen } from '../screens/send/DepositWaitingScreen';
import { SuccessScreen } from '../screens/send/SuccessScreen';

// Processor Screens
import { TransactionStreamScreen } from '../screens/processor/TransactionStreamScreen';
import { ProcessorTransactionDetailScreen } from '../screens/processor/ProcessorTransactionDetailScreen';
import { ProcessorOnboardingScreen } from '../screens/settings/ProcessorOnboardingScreen';

// ─── Param lists ───
export type OnboardingStackParamList = {
  Splash: undefined;
  SignUp: undefined;
  SignIn: undefined;
  OTP: {
    phoneNumber: string;
    cooldownSeconds: number;
    registrationPayload: InitiateRegistrationRequest;
  };
  ForgotPassword: undefined;
  ResetPassword: {
    email: string;
    cooldownSeconds: number;
  };
};

export type HistoryStackParamList = {
  History: undefined;
  TransferDetail: { transferId?: string; status?: string };
};

export type ProfileStackParamList = {
  Profile: undefined;
  ProcessorOnboarding: undefined;
};

export type SendFlowParamList = {
  Amount: undefined;
  Recipient: {
    amount: number;
    sendCurrency: string;
    receiveCurrency: string;
    receiveAmount: number;
  };
  Confirm: {
    amount: number;
    sendCurrency: string;
    receiveCurrency: string;
    receiveAmount: number;
    recipientName: string;
    recipientInitials: string;
    recipientColors: [string, string];
    recipientMethod: string;
    recipientPhone?: string;
    recipientFlag: string;
    recipientWalletAddress?: string;
    recipientNetwork?: string;
    corridorId?: string;
  };
  DepositWaiting: {
    transactionSlug?: string;
    transactionId?: string;
    recipientName?: string;
    recipientInitials?: string;
    recipientMethod?: string;
    recipientFlag?: string;
    amount?: number;
    receiveAmount?: number;
    sendCurrency?: string;
    recvCurrency?: string;
    walletAddress?: string;
    network?: string;
    recipientWalletAddress?: string;
    recipientNetwork?: string;
  };
  Success: {
    transactionSlug?: string;
    recipientName?: string;
    recipientInitials?: string;
    recipientMethod?: string;
    recipientFlag?: string;
    amount?: number;
    receiveAmount?: number;
    recvCurrency?: string;
    sendCurrency?: string;
    recipientWalletAddress?: string;
    recipientNetwork?: string;
  };
};

export type ProcessorStackParamList = {
  TransactionStream: undefined;
  ProcessorTransactionDetail: { transactionId: string; slug: string };
};

export type MainTabParamList = {
  HistoryTab: undefined;
  SendTab: undefined;
  ProcessorTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  PinSetup: undefined;
  PinVerify: undefined;
  PinReset: { cooldownSeconds: number };
  Main: undefined;
};

// ─── Navigators ───
const RootStack = createNativeStackNavigator<RootStackParamList>();
const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const HistoryStackNav = createNativeStackNavigator<HistoryStackParamList>();
const ProfileStackNav = createNativeStackNavigator<ProfileStackParamList>();
const SendFlowStack = createNativeStackNavigator<SendFlowParamList>();
const ProcessorStackNav = createNativeStackNavigator<ProcessorStackParamList>();

// ─── Stack screens ───
function OnboardingNavigator() {
  return (
    <OnboardingStack.Navigator
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <OnboardingStack.Screen name="Splash" component={SplashScreen} options={{ animation: 'fade' }} />
      <OnboardingStack.Screen name="SignUp" component={SignUpScreen} />
      <OnboardingStack.Screen name="SignIn" component={SignInScreen} />
      <OnboardingStack.Screen name="OTP" component={OTPScreen} />
      <OnboardingStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <OnboardingStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </OnboardingStack.Navigator>
  );
}

function HistoryStackNavigator() {
  return (
    <HistoryStackNav.Navigator
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <HistoryStackNav.Screen name="History" component={HistoryScreen} />
      <HistoryStackNav.Screen name="TransferDetail" component={TransactionDetailScreen} />
    </HistoryStackNav.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStackNav.Navigator
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <ProfileStackNav.Screen name="Profile" component={ProfileScreen} />
      <ProfileStackNav.Screen name="ProcessorOnboarding" component={ProcessorOnboardingScreen} />
    </ProfileStackNav.Navigator>
  );
}

function SendTabNavigator() {
  return (
    <SendFlowStack.Navigator
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <SendFlowStack.Screen name="Amount" component={AmountScreen} />
      <SendFlowStack.Screen name="Recipient" component={RecipientScreen} />
      <SendFlowStack.Screen name="Confirm" component={ConfirmScreen} />
      <SendFlowStack.Screen name="DepositWaiting" component={DepositWaitingScreen} options={{ animation: 'fade_from_bottom', gestureEnabled: false }} />
      <SendFlowStack.Screen name="Success" component={SuccessScreen} options={{ animation: 'fade_from_bottom', gestureEnabled: false }} />
    </SendFlowStack.Navigator>
  );
}

function ProcessorStackNavigator() {
  return (
    <ProcessorStackNav.Navigator
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <ProcessorStackNav.Screen name="TransactionStream" component={TransactionStreamScreen} />
      <ProcessorStackNav.Screen name="ProcessorTransactionDetail" component={ProcessorTransactionDetailScreen} />
    </ProcessorStackNav.Navigator>
  );
}

function getTabIcon(routeName: string): string {
  switch (routeName) {
    case 'HistoryTab':
      return 'time';
    case 'SendTab':
      return 'send';
    case 'ProcessorTab':
      return 'swap-horizontal';
    case 'ProfileTab':
      return 'person';
    default:
      return 'ellipse';
  }
}

function MainTabs() {
  const user = useAuthStore((state) => state.user);
  const { theme } = useTheme();
  const role: UserRole = user?.role || 'PAYER';

  const showHistory = role === 'PAYER' || role === 'BOTH' || role === 'ADMIN';
  const showSend = role === 'PAYER' || role === 'BOTH' || role === 'ADMIN';
  const showProcessor = role === 'MP' || role === 'BOTH' || role === 'ADMIN';

  const getInitialRoute = (): keyof MainTabParamList => {
    if (role === 'MP') return 'ProcessorTab';
    return 'SendTab';
  };

  return (
    <Tab.Navigator
      initialRouteName={getInitialRoute()}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.background.default,
          borderTopColor: theme.divider,
          borderTopWidth: 1,
          height: 88,
          paddingTop: 8,
          paddingBottom: 28,
        },
        tabBarActiveTintColor: theme.secondary.main,
        tabBarInactiveTintColor: theme.text.muted,
        tabBarLabelStyle: {
          fontFamily: 'Inter_600SemiBold',
          fontSize: 9,
          letterSpacing: 0.6,
          textTransform: 'uppercase' as const,
        },
        tabBarIcon: ({ focused, color }) => {
          const iconName = getTabIcon(route.name);
          return (
            <View style={{ transform: [{ scale: focused ? 1.15 : 1 }] }}>
              <Ionicons name={iconName} size={20} color={color} />
            </View>
          );
        },
      })}
    >
      {showHistory && (
        <Tab.Screen
          name="HistoryTab"
          component={HistoryStackNavigator}
          options={{ tabBarLabel: 'HISTORY' }}
        />
      )}
      {showSend && (
        <Tab.Screen
          name="SendTab"
          component={SendTabNavigator}
          options={{ tabBarLabel: 'SEND' }}
        />
      )}
      {showProcessor && (
        <Tab.Screen
          name="ProcessorTab"
          component={ProcessorStackNavigator}
          options={{ tabBarLabel: 'PROCESS' }}
        />
      )}
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{ tabBarLabel: 'PROFILE' }}
      />
    </Tab.Navigator>
  );
}

function LoadingScreen() {
  const { theme } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.background.default, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color={theme.secondary.main} />
    </View>
  );
}

export const AppNavigator: React.FC = () => {
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const isPinLocked = useAuthStore((state) => state.isPinLocked);
  
  const hasPin = user?.pinSet ?? false;

  if (!isHydrated) {
    return <LoadingScreen />;
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {!isAuthenticated ? (
        <RootStack.Screen name="Onboarding" component={OnboardingNavigator} />
      ) : isPinLocked ? (
        <>
          <RootStack.Screen name="PinVerify" component={PinVerifyScreen} />
          <RootStack.Screen name="PinReset" component={PinResetScreen} />
        </>
      ) : !hasPin ? (
        <RootStack.Screen name="PinSetup" component={PinSetupScreen} />
      ) : (
        <RootStack.Screen name="Main" component={MainTabs} />
      )}
    </RootStack.Navigator>
  );
};

