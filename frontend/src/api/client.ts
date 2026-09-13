import type { AppStatus, SystemStats } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(body || `${path} responded with ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function fetchSystemStats(): Promise<SystemStats> {
  return getJson<SystemStats>('/api/system');
}

export function fetchAppStatuses(): Promise<AppStatus[]> {
  return getJson<AppStatus[]>('/api/apps');
}
