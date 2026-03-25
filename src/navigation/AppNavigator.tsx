import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

// Screens
import { SplashScreen } from '../screens/onboarding/SplashScreen';
import { SignUpScreen } from '../screens/onboarding/SignUpScreen';
import { OTPScreen } from '../screens/onboarding/OTPScreen';
import type { DestInfo } from '../screens/home/HomeScreen';
import { HistoryScreen } from '../screens/portfolio/PortfolioScreen';
import { TransactionDetailScreen } from '../screens/transaction/TransactionDetailScreen';
import { ProfileScreen } from '../screens/settings/SettingsScreen';
import { RecipientScreen } from '../screens/send/RecipientScreen';
import { AmountScreen } from '../screens/send/AmountScreen';
import { TrackingScreen } from '../screens/send/TrackingScreen';
import { SuccessScreen } from '../screens/send/SuccessScreen';

// ─── Param lists ───
export type OnboardingStackParamList = {
  Splash: undefined;
  SignUp: undefined;
  OTP: { phone: string };
};

export type HistoryStackParamList = {
  History: undefined;
  TransferDetail: { transferId?: string; status?: string };
};

export type ProfileStackParamList = {
  Profile: undefined;
};

export type SendFlowParamList = {
  Recipient: { dest?: DestInfo };
  Amount: {
    recipientName?: string;
    recipientInitials?: string;
    recipientColors?: [string, string];
    recipientMethod?: string;
    recipientPhone?: string;
    recipientFlag?: string;
    lastAmount?: number;
    dest?: DestInfo;
  };
  Tracking: {
    recipientName?: string;
    recipientInitials?: string;
    recipientColors?: [string, string];
    recipientMethod?: string;
    recipientFlag?: string;
    amount?: number;
    receiveAmount?: number;
    dest?: DestInfo;
  };
  Success: {
    recipientName?: string;
    recipientInitials?: string;
    recipientMethod?: string;
    recipientFlag?: string;
    amount?: number;
    receiveAmount?: number;
    dest?: DestInfo;
  };
};

export type MainTabParamList = {
  HistoryTab: undefined;
  SendTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
};

// ─── Navigators ───
const RootStack = createNativeStackNavigator<RootStackParamList>();
const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const HistoryStackNav = createNativeStackNavigator<HistoryStackParamList>();
const ProfileStackNav = createNativeStackNavigator<ProfileStackParamList>();
const SendFlowStack = createNativeStackNavigator<SendFlowParamList>();

// ─── Stack screens ───
function OnboardingNavigator() {
  return (
    <OnboardingStack.Navigator
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <OnboardingStack.Screen name="Splash" component={SplashScreen} />
      <OnboardingStack.Screen name="SignUp" component={SignUpScreen} />
      <OnboardingStack.Screen name="OTP" component={OTPScreen} />
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
    </ProfileStackNav.Navigator>
  );
}

function SendTabNavigator() {
  return (
    <SendFlowStack.Navigator
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <SendFlowStack.Screen name="Recipient" component={RecipientScreen} />
      <SendFlowStack.Screen name="Amount" component={AmountScreen} />
      <SendFlowStack.Screen name="Tracking" component={TrackingScreen} />
      <SendFlowStack.Screen name="Success" component={SuccessScreen} />
    </SendFlowStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="SendTab"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#111118',
          borderTopColor: 'rgba(255,255,245,0.08)',
          borderTopWidth: 1,
          height: 88,
          paddingTop: 8,
          paddingBottom: 28,
        },
        tabBarActiveTintColor: '#00E5A0',
        tabBarInactiveTintColor: 'rgba(255,255,245,0.4)',
        tabBarLabelStyle: {
          fontFamily: 'Inter_600SemiBold',
          fontSize: 9,
          letterSpacing: 0.6,
          textTransform: 'uppercase' as const,
        },
        tabBarIcon: ({ focused, color }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'ellipse';
          switch (route.name) {
            case 'HistoryTab':
              iconName = focused ? 'time' : 'time-outline';
              break;
            case 'SendTab':
              iconName = focused ? 'send' : 'send-outline';
              break;
            case 'ProfileTab':
              iconName = focused ? 'person' : 'person-outline';
              break;
          }
          return <Ionicons name={iconName} size={20} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="HistoryTab"
        component={HistoryStackNavigator}
        options={{ tabBarLabel: 'HISTORY' }}
      />
      <Tab.Screen
        name="SendTab"
        component={SendTabNavigator}
        options={{ tabBarLabel: 'SEND' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{ tabBarLabel: 'PROFILE' }}
      />
    </Tab.Navigator>
  );
}

export const AppNavigator: React.FC = () => {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Onboarding" component={OnboardingNavigator} />
      <RootStack.Screen name="Main" component={MainTabs} />
    </RootStack.Navigator>
  );
};
