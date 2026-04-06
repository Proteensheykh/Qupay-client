export type UserRole = 'PAYER' | 'MP' | 'BOTH' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'BANNED';
export type OtpPurpose = 'REGISTRATION' | 'LOGIN' | 'PASSWORD_RESET' | 'PIN_RESET';

export interface InitiateRegistrationRequest {
  phoneNumber: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface CompleteRegistrationRequest {
  phoneNumber: string;
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
  purpose: OtpPurpose;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface InitiatePasswordResetRequest {
  email: string;
}

export interface CompletePasswordResetRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export interface UserProfileResponse {
  id: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  walletAddress: string | null;
  mobileMoney: string | null;
  role: UserRole;
  status: UserStatus;
  pinSet: boolean;
  createdAt: string;
}

export interface SetPinRequest {
  pin: string;
}

export interface VerifyPinRequest {
  pin: string;
}

export interface VerifyPinResponse {
  valid: boolean;
}

export interface ChangePinRequest {
  currentPin: string;
  newPin: string;
}

export interface CompletePinResetRequest {
  otp: string;
  newPin: string;
}
