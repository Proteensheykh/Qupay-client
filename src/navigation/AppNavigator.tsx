import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '../components/Icon';
import { useAuthStore } from '../store/authStore';
import { useUser } from '../hooks/useUser';
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
import { SuspendedScreen } from '../screens/onboarding/SuspendedScreen';

import { HistoryScreen } from '../screens/portfolio/PortfolioScreen';
import { TransactionDetailScreen } from '../screens/transaction/TransactionDetailScreen';
import { ProfileScreen } from '../screens/settings/SettingsScreen';
import { RecipientScreen } from '../screens/send/RecipientScreen';
import { AmountScreen } from '../screens/send/AmountScreen';
import { ConfirmScreen } from '../screens/send/ConfirmScreen';
import { TransactionStatusScreen } from '../screens/send/TransactionStatusScreen';

// Processor Screens
import { MpHomeScreen } from '../screens/processor/MpHomeScreen';
import { OrderDetailScreen } from '../screens/processor/OrderDetailScreen';
import { MpProfileScreen } from '../screens/processor/MpProfileScreen';
import { ProcessorSetupScreen } from '../screens/processor/ProcessorSetupScreen';
import { KycSubmissionScreen } from '../screens/processor/onboarding/KycSubmissionScreen';
import { BindWalletScreen } from '../screens/processor/onboarding/BindWalletScreen';
import { BindBankAccountScreen } from '../screens/processor/onboarding/BindBankAccountScreen';
import { MpOnboardScreen } from '../screens/processor/onboarding/MpOnboardScreen';

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
    sessionToken: string;
  };
};

export type HistoryStackParamList = {
  History: undefined;
  TransferDetail: { transactionId: string };
};

export type ProfileStackParamList = {
  Profile: undefined;
  ProcessorSetup: undefined;
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
    recipientBankCode?: string;
    recipientAccountNumber?: string;
    recipientAccountName?: string;
  };
  TransactionStatus: {
    transactionId: string;
  };
};

export type ProcessorStackParamList = {
  MpHome: undefined;
  OrderDetail: { transactionId: string; orderId: string; isQueueItem: boolean };
  MpProfile: undefined;
  ProcessorSetup: undefined;
  KycSubmission: undefined;
  BindWallet: undefined;
  BindBankAccount: undefined;
  MpOnboard: undefined;
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
  Suspended: undefined;
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
      <ProfileStackNav.Screen name="ProcessorSetup" component={ProcessorSetupScreen} />
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
      <SendFlowStack.Screen name="TransactionStatus" component={TransactionStatusScreen} options={{ animation: 'fade_from_bottom', gestureEnabled: false }} />
    </SendFlowStack.Navigator>
  );
}

function ProcessorStackNavigator() {
  return (
    <ProcessorStackNav.Navigator
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <ProcessorStackNav.Screen name="MpHome" component={MpHomeScreen} />
      <ProcessorStackNav.Screen name="OrderDetail" component={OrderDetailScreen} />
      <ProcessorStackNav.Screen name="MpProfile" component={MpProfileScreen} />
      <ProcessorStackNav.Screen name="ProcessorSetup" component={ProcessorSetupScreen} />
      <ProcessorStackNav.Screen name="KycSubmission" component={KycSubmissionScreen} />
      <ProcessorStackNav.Screen name="BindWallet" component={BindWalletScreen} />
      <ProcessorStackNav.Screen name="BindBankAccount" component={BindBankAccountScreen} />
      <ProcessorStackNav.Screen name="MpOnboard" component={MpOnboardScreen} />
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
  const { user } = useUser();
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
  const isSuspended = user?.status === 'SUSPENDED' || user?.status === 'BANNED';

  if (!isHydrated) {
    return <LoadingScreen />;
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {!isAuthenticated ? (
        <RootStack.Screen name="Onboarding" component={OnboardingNavigator} />
      ) : isSuspended ? (
        <RootStack.Screen name="Suspended" component={SuspendedScreen} />
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

