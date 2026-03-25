# Qupay

Cross-border crypto-to-cash remittance app. Send USDT, recipients get mobile money or bank transfers in under 2 minutes. No crypto account needed on the receiving end.

## Features

- **Send Flow** — Recipient lookup with smart resolution, amount entry with live rate lock, approval confirmation, real-time tracking with 4-step progress, and delivery success with SMS notification
- **History** — Transfer list with status indicators (delivered, pending, failed, disputed) and detailed receipt view with share actions
- **Profile** — User stats, corridor management, security settings, and wallet connections
- **Onboarding** — Country selection with regulatory compliance, phone verification with OTP

## Supported Corridors

Singapore, UK, US, UAE, Nigeria, and more — sending to 40+ countries including Nigeria (OPay, GTBank, PalmPay), Ghana (MTN Momo), Kenya (M-Pesa), Philippines (GCash), India (UPI), Pakistan (EasyPaisa).

## Tech Stack

- **React Native** 0.83 with **Expo** SDK 55
- **React** 19
- **TypeScript**
- **React Navigation** (bottom tabs + native stack)
- **Expo Linear Gradient**, **Expo Haptics**
- **Inter** font family via `@expo-google-fonts/inter`

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npx expo start

# Run on web
npx expo start --web

# Run on iOS simulator
npx expo start --ios

# Run on Android emulator
npx expo start --android
```

## Project Structure

```
src/
  components/     # Reusable UI components (CTAButton, BottomSheet, GradientAvatar, etc.)
  data/           # Mock data (corridors, contacts, transfers, user profile)
  hooks/          # Custom hooks
  navigation/     # App navigator with tab + stack routing
  screens/
    onboarding/   # Splash, SignUp, OTP
    send/         # Recipient, Amount, Tracking, Success
    portfolio/    # History / transfer list
    transaction/  # Transfer detail / receipt
    settings/     # Profile
  theme/          # Colors, typography, spacing tokens
  utils/          # Utilities
```

## Navigation

Three bottom tabs: **History** | **Send** (default) | **Profile**

The Send tab contains the full send flow: Recipient > Amount > Tracking > Success.

## Design

Dark theme with signal green (#00E5A0) accent. Design files available in Figma.
