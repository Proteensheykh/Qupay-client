import { apiClient } from './client';
import type {
  InitiateRegistrationRequest,
  CompleteRegistrationRequest,
  LoginRequest,
  AuthTokenResponse,
  OtpInitiatedResponse,
  RefreshTokenRequest,
  ResendOtpRequest,
  LogoutRequest,
  InitiatePasswordResetRequest,
  CompletePasswordResetRequest,
  UserProfileResponse,
  SetPinRequest,
  VerifyPinRequest,
  VerifyPinResponse,
  ChangePinRequest,
  CompletePinResetRequest,
} from '../types/auth';

export async function initiateRegistration(
  request: InitiateRegistrationRequest
): Promise<OtpInitiatedResponse> {
  const response = await apiClient.post<OtpInitiatedResponse>(
    '/v1/auth/register/initiate',
    request
  );
  return response.data;
}

export async function completeRegistration(
  request: CompleteRegistrationRequest
): Promise<AuthTokenResponse> {
  const response = await apiClient.post<AuthTokenResponse>(
    '/v1/auth/register/complete',
    request
  );
  return response.data;
}

export async function login(request: LoginRequest): Promise<AuthTokenResponse> {
  const response = await apiClient.post<AuthTokenResponse>('/v1/auth/login', request);
  return response.data;
}

export async function refreshToken(
  request: RefreshTokenRequest
): Promise<AuthTokenResponse> {
  const response = await apiClient.post<AuthTokenResponse>(
    '/v1/auth/token/refresh',
    request
  );
  return response.data;
}

export async function resendOtp(
  request: ResendOtpRequest
): Promise<OtpInitiatedResponse> {
  const response = await apiClient.post<OtpInitiatedResponse>(
    '/v1/auth/otp/resend',
    request
  );
  return response.data;
}

export async function serverLogout(request: LogoutRequest): Promise<void> {
  await apiClient.post('/v1/auth/logout', request);
}

export async function initiatePasswordReset(
  request: InitiatePasswordResetRequest
): Promise<OtpInitiatedResponse> {
  const response = await apiClient.post<OtpInitiatedResponse>(
    '/v1/auth/password/reset/initiate',
    request
  );
  return response.data;
}

export async function completePasswordReset(
  request: CompletePasswordResetRequest
): Promise<void> {
  await apiClient.post('/v1/auth/password/reset/complete', request);
}

export async function getProfile(): Promise<UserProfileResponse> {
  const response = await apiClient.get<UserProfileResponse>('/v1/users/me');
  return response.data;
}

export async function setPin(request: SetPinRequest): Promise<void> {
  await apiClient.post('/v1/users/me/pin', request);
}

export async function verifyPin(request: VerifyPinRequest): Promise<VerifyPinResponse> {
  const response = await apiClient.post<VerifyPinResponse>('/v1/users/me/pin/verify', request);
  return response.data;
}

export async function changePin(request: ChangePinRequest): Promise<void> {
  await apiClient.put('/v1/users/me/pin', request);
}

export async function initiatePinReset(): Promise<OtpInitiatedResponse> {
  const response = await apiClient.post<OtpInitiatedResponse>('/v1/users/me/pin/reset/initiate');
  return response.data;
}

export async function completePinReset(request: CompletePinResetRequest): Promise<void> {
  await apiClient.post('/v1/users/me/pin/reset/complete', request);
}
