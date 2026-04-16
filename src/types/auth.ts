export type UserRole = 'PAYER' | 'MP' | 'BOTH' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'BANNED';
export type CryptoNetwork = 'SOLANA' | 'ERC20' | 'TRC20' | 'BEP20';

export interface InitiateRegistrationRequest {
  phoneNumber: string;
  countryCode?: string;
  role?: UserRole;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  username?: string;
}

export interface CompleteRegistrationRequest {
  phoneNumber: string;
  countryCode?: string;
  otp: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface OtpInitiatedResponse {
  message: string;
  cooldownSeconds: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ResendOtpRequest {
  email: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface InitiatePasswordResetRequest {
  email: string;
}

export interface PasswordResetInitiatedResponse {
  message: string;
  cooldownSeconds: number;
  sessionToken: string;
}

export interface CompletePasswordResetRequest {
  sessionToken: string;
  otp: string;
  newPassword: string;
}

export interface BankAccountResponse {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface CryptoWalletResponse {
  network: CryptoNetwork;
  address: string;
}

export interface UserProfileResponse {
  id: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  walletAddress: string | null;
  mobileMoney: string | null;
  role: UserRole;
  status: UserStatus;
  pinSet: boolean;
  bankAccounts: BankAccountResponse[];
  cryptoWallets: CryptoWalletResponse[];
  createdAt: string;
}

export interface SetPinRequest {
  pin: string;
}

export interface VerifyPinRequest {
  pin: string;
}

export interface ChangePinRequest {
  currentPin: string;
  newPin: string;
}

export interface CompletePinResetRequest {
  otp: string;
  newPin: string;
}

export interface BindBankAccountRequest {
  bankCode: string;
  accountNumber: string;
}

export interface BindCryptoWalletRequest {
  network: CryptoNetwork;
  address: string;
}

export interface PublicProfileResponse {
  username: string;
  firstName: string;
  lastName: string;
  walletAddress: string | null;
}
