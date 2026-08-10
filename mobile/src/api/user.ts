import request from './client';
import { UserProfile, SavedMeasureResult } from '../types';

export function getMe(token: string): Promise<UserProfile> {
  return request<UserProfile>('/user/me', undefined, { method: 'GET', token });
}

// GDPR Art. 15 & 20 — right of access + portability. Shape mirrors the
// backend's exportMyData response exactly (see userController.js).
export interface ExportedAccountData {
  exportedAt: string;
  profile: { id: string; username: string; role: string; createdAt: string };
  privacyPolicy: unknown;
  consent: unknown;
  conversations: unknown[];
  measureResults: unknown[];
  spillEntries: unknown[];
  feedback: unknown[];
}

export function exportMyData(token: string): Promise<ExportedAccountData> {
  return request<ExportedAccountData>('/user/me/data', undefined, { method: 'GET', token });
}

// GDPR Art. 17 — right to erasure.
export function deleteAccount(token: string): Promise<{ success: boolean }> {
  return request('/user/me', undefined, { method: 'DELETE', token });
}

export function updateEmail(token: string, email: string): Promise<{ success: boolean; email: string }> {
  return request('/user/me/email', { email }, { token });
}

export function grantConsent(token: string): Promise<{ success: boolean }> {
  return request('/user/me/consent', undefined, { method: 'POST', token });
}

export function withdrawConsent(token: string): Promise<{ success: boolean }> {
  return request('/user/me/consent', undefined, { method: 'DELETE', token });
}

export function getMeasureHistory(token: string): Promise<SavedMeasureResult[]> {
  return request<SavedMeasureResult[]>('/measure/history', undefined, { method: 'GET', token });
}
