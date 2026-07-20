import request from './client';
import { AuthSession } from '../types';

export function register(
  username: string,
  password: string,
  privacyPolicyAccepted: boolean,
  email?: string
): Promise<AuthSession> {
  return request<AuthSession>('/auth/register', {
    username,
    password,
    privacyPolicyAccepted,
    email: email || undefined,
  });
}

export function login(username: string, password: string): Promise<AuthSession> {
  return request<AuthSession>('/auth/login', { username, password });
}

export function changePassword(
  token: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean }> {
  return request('/auth/change-password', { currentPassword, newPassword }, { token });
}

export function requestPasswordReset(username: string): Promise<{ success: boolean }> {
  return request('/auth/forgot-password', { username });
}

export function resetPassword(
  username: string,
  code: string,
  newPassword: string
): Promise<{ success: boolean }> {
  return request('/auth/reset-password', { username, code, newPassword });
}
