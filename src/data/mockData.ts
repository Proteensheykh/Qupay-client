/**
 * Static reference data that does not come from the backend today.
 *
 * Everything in this file is either:
 *  - Configuration the backend doesn't yet serve (countries, networks, walletContacts)
 *  - Placeholder user profile data for prototype screens
 *
 * Data that the backend *does* serve (banks, rates, transactions) has been
 * removed — screens should use the hooks/functions in src/api/ instead.
 */

// ---------------------------------------------------------------------------
// Countries (used by SignUpScreen country picker)
// ---------------------------------------------------------------------------

export interface Country {
  flag: string;
  name: string;
  code: string;   // dialling code
  iso: string;     // ISO 3166-1 alpha-2
  reg: string;     // regulatory label
  currency: string;
}

export const countries: Country[] = [
  { flag: '🇸🇬', name: 'Singapore',      code: '+65',  iso: 'SG', reg: 'MAS regulated',    currency: 'SGD' },
  { flag: '🇬🇧', name: 'United Kingdom', code: '+44',  iso: 'GB', reg: 'FCA regulated',    currency: 'GBP' },
  { flag: '🇺🇸', name: 'United States',  code: '+1',   iso: 'US', reg: 'FinCEN regulated', currency: 'USD' },
  { flag: '🇦🇪', name: 'UAE',            code: '+971', iso: 'AE', reg: 'VARA regulated',   currency: 'AED' },
  { flag: '🇳🇬', name: 'Nigeria',        code: '+234', iso: 'NG', reg: 'SEC/CBN regulated', currency: 'NGN' },
  { flag: '🇬🇭', name: 'Ghana',          code: '+233', iso: 'GH', reg: 'BoG regulated',    currency: 'GHS' },
  { flag: '🇰🇪', name: 'Kenya',          code: '+254', iso: 'KE', reg: 'CBK regulated',    currency: 'KES' },
  { flag: '🇮🇳', name: 'India',          code: '+91',  iso: 'IN', reg: 'RBI regulated',    currency: 'INR' },
  { flag: '🇵🇭', name: 'Philippines',    code: '+63',  iso: 'PH', reg: 'BSP regulated',    currency: 'PHP' },
  { flag: '🇲🇽', name: 'Mexico',         code: '+52',  iso: 'MX', reg: 'CNBV regulated',   currency: 'MXN' },
  { flag: '🇵🇰', name: 'Pakistan',       code: '+92',  iso: 'PK', reg: 'SBP regulated',    currency: 'PKR' },
  { flag: '🇿🇦', name: 'South Africa',   code: '+27',  iso: 'ZA', reg: 'SARB regulated',   currency: 'ZAR' },
];

// ---------------------------------------------------------------------------
// Blockchain networks (used by RecipientScreen & ProcessorOnboardingScreen)
// ---------------------------------------------------------------------------

export interface Network {
  id: string;
  name: string;
  icon: string;
  gasEstimate: string;
  address: string;
}

export const networks: Network[] = [
  { id: 'ethereum', name: 'Ethereum',  icon: 'logo-electron',       gasEstimate: '~$2.50', address: '0x7a3B8c9D1e2F3a4B5c6D7e8F9a0B1c2D3e4F2e' },
  { id: 'polygon',  name: 'Polygon',   icon: 'triangle-outline',    gasEstimate: '~$0.01', address: '0x4c2A9f8E3d7B6a1C0e5F2d8A9b4C7e6F3a1D5b' },
  { id: 'arbitrum', name: 'Arbitrum',  icon: 'git-branch-outline',  gasEstimate: '~$0.15', address: '0x9d5F2e8A1b3C7d6E0f4A8B9c2D5e7F1a3B6c4d' },
  { id: 'base',     name: 'Base',      icon: 'layers-outline',      gasEstimate: '~$0.05', address: '0x1e8B4f7A2c9D3e6F5a0B8c1D4e7F9a2B5c3D6e' },
];

// ---------------------------------------------------------------------------
// Wallet contacts (used by RecipientScreen wallet tab)
// ---------------------------------------------------------------------------

export interface WalletContact {
  id: string;
  name: string;
  initials: string;
  colors: [string, string];
  walletAddress: string;
  network: string;
  networkIcon: string;
}

export const walletContacts: WalletContact[] = [
  { id: 'w1', name: 'Alex Chen',     initials: 'AC', colors: ['#9E79D2', '#B893EC'], walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18', network: 'Polygon',  networkIcon: 'triangle-outline' },
  { id: 'w2', name: 'Sarah Kim',     initials: 'SK', colors: ['#F3C23D', '#F3AF25'], walletAddress: '0x8Ba1f109551bD432803012645Ac136ddd64DBA72', network: 'Base',     networkIcon: 'layers-outline' },
  { id: 'w3', name: 'Mike Johnson',  initials: 'MJ', colors: ['#8353C5', '#B893EC'], walletAddress: '0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec', network: 'Ethereum', networkIcon: 'logo-electron' },
];

// ---------------------------------------------------------------------------
// User profile stub (used by HomeScreen, SettingsScreen, SuccessScreen)
// Replace with authenticated user context once the backend serves /api/me.
// ---------------------------------------------------------------------------

export const userProfile = {
  name: 'Raj',
  initials: 'RA',
  phone: '+65 9123 4567',
  country: 'Singapore',
  flag: '🇸🇬',
  email: 'raj@example.com',
  joinedDate: '2025-11-01',
  totalSent: 4_280,
  totalTransfers: 23,
  totalSaved: 186.50,
  defaultCorridor: 'sg-ng',
};
