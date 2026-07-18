import request from './client';
import { AuthSession } from '../types';

export function register(
  username: string,
  password: string,
  privacyPolicyAccepted: boolean
): Promise<AuthSession> {
  return request<AuthSession>('/auth/register', { username, password, privacyPolicyAccepted });
}

export function login(username: string, password: string): Promise<AuthSession> {
  return request<AuthSession>('/auth/login', { username, password });
}
