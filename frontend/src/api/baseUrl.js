const explicitApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, "");

const defaultApiBaseUrl = import.meta.env.DEV
  ? `${window.location.protocol}//${window.location.hostname}:3001/api`
  : "/api";

export const API_BASE_URL = explicitApiBaseUrl || defaultApiBaseUrl;

export function apiUrl(path = "") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}
