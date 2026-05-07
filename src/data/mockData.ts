/**
 * Static reference data that does not come from the backend today.
 *
 * Currently only `countries` lives here (used by the SignUp country picker).
 * Banks, rates, transactions, user profile, and supported networks all flow
 * through the API hooks in `src/api/` and `src/constants/supportedChannels.ts`.
 */

export interface Country {
  flag: string;
  name: string;
  code: string;   // dialling code
  iso: string;     // ISO 3166-1 alpha-2
  reg: string;     // regulatory label
  currency: string;
}

export const countries: Country[] = [
  { flag: '🇳🇬', name: 'Nigeria',        code: '+234', iso: 'NG', reg: 'SEC/CBN regulated', currency: 'NGN' },
  { flag: '🇸🇬', name: 'Singapore',      code: '+65',  iso: 'SG', reg: 'MAS regulated',    currency: 'SGD' },
  { flag: '🇬🇧', name: 'United Kingdom', code: '+44',  iso: 'GB', reg: 'FCA regulated',    currency: 'GBP' },
  { flag: '🇺🇸', name: 'United States',  code: '+1',   iso: 'US', reg: 'FinCEN regulated', currency: 'USD' },
  { flag: '🇦🇪', name: 'UAE',            code: '+971', iso: 'AE', reg: 'VARA regulated',   currency: 'AED' },
  { flag: '🇬🇭', name: 'Ghana',          code: '+233', iso: 'GH', reg: 'BoG regulated',    currency: 'GHS' },
  { flag: '🇰🇪', name: 'Kenya',          code: '+254', iso: 'KE', reg: 'CBK regulated',    currency: 'KES' },
  { flag: '🇮🇳', name: 'India',          code: '+91',  iso: 'IN', reg: 'RBI regulated',    currency: 'INR' },
  { flag: '🇵🇭', name: 'Philippines',    code: '+63',  iso: 'PH', reg: 'BSP regulated',    currency: 'PHP' },
  { flag: '🇲🇽', name: 'Mexico',         code: '+52',  iso: 'MX', reg: 'CNBV regulated',   currency: 'MXN' },
  { flag: '🇵🇰', name: 'Pakistan',       code: '+92',  iso: 'PK', reg: 'SBP regulated',    currency: 'PKR' },
  { flag: '🇿🇦', name: 'South Africa',   code: '+27',  iso: 'ZA', reg: 'SARB regulated',   currency: 'ZAR' },
];
