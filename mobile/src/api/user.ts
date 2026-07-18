import request from './client';
import { UserProfile, SavedMeasureResult } from '../types';

export function getMe(token: string): Promise<UserProfile> {
  return request<UserProfile>('/user/me', undefined, { method: 'GET', token });
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
