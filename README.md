# Qupay

Cross-border crypto-to-cash remittance app. Send USDT, recipients get bank transfers in under 2 minutes. No crypto account needed on the receiving end.

## v1 Scope

Qupay v1 supports **USDT ↔ NGN** end-to-end via:

- **NGN payout:** Nigerian bank account
- **USDT payout:** Solana wallet

Additional corridors, mobile money, and non-Solana networks are visible in the UI but marked "Coming soon".

## Features

- **Send Flow** — Amount entry with live estimated rate, recipient resolution (bank validation for NGN, Solana address for USDT), confirmation with PIN, real-time transaction status tracking (QUEUED → IN_PROGRESS → PAYER_PAID → COMPLETE)
- **History** — Transaction list with status indicators and detailed receipt view with share actions
- **Processor (MP) Flow** — Queue browsing, order acceptance, payout tracking, proof-of-payment upload, online/offline toggle, MP profile with balances and badge level
- **MP Onboarding** — 4-step checklist: KYC submission, Solana wallet binding, bank account binding, MP details (staked USDT, operating hours)
- **Profile** — User stats, appearance settings, notification toggle, account security
- **Onboarding** — Country selection, phone verification with OTP, PIN setup
- **Global Toasts** — Toast notification system replacing native alerts throughout the app

## Tech Stack

- **React Native** 0.83 with **Expo** SDK 55
- **React** 19
- **TypeScript**
- **React Navigation** (bottom tabs + native stack)
- **React Query** (`@tanstack/react-query`) for server state
- **Zustand** for auth/PIN state and local stores (toasts, recent recipients)
- **Axios** with token refresh interceptor
- **Expo Linear Gradient**, **Expo Haptics**, **Expo Document Picker**
- **libphonenumber-js** for phone validation
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
  api/            # Backend API clients (transactions, users, MP, KYC, uploads)
  components/     # Reusable UI components (CTAButton, BottomSheet, ToastHost, etc.)
  constants/      # Supported channels, pairs, networks
  data/           # Static reference data (countries, networks)
  hooks/          # Custom hooks (useUser, useTransactions, useMpQueue, useToast, etc.)
  navigation/     # App navigator with tab + stack routing
  screens/
    onboarding/   # Splash, SignUp, SignIn, OTP, PIN, Suspended
    send/         # Amount, Recipient, Confirm, TransactionStatus, Success
    portfolio/    # History / transaction list
    transaction/  # Transaction detail / receipt
    processor/    # MP home, order detail, profile, onboarding sub-screens
    settings/     # Profile
  store/          # Zustand stores (auth, toasts, recent recipients)
  theme/          # Colors, typography, spacing tokens
  types/          # TypeScript types (auth, transaction)
  utils/          # Utilities (phone validation, transaction status helpers)
```

## Navigation

Four bottom tabs (role-gated): **History** | **Send** (default) | **Process** (MP/BOTH only) | **Profile**

- **Send:** Amount → Recipient → Confirm → TransactionStatus → Success
- **Process:** MpHome (Queue/Active/Completed tabs) → OrderDetail → MpProfile
- **Profile:** Settings → ProcessorSetup (for non-MP users to begin onboarding)

## Design

Squid Router-inspired design system with royal purple (#9E79D2) primary and amber (#F3C23D) highlight accent. Inter typeface. Dark-first with mirrored light mode.
