import type { AppStatus, SystemStats } from './types';

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) {
    throw new Error(`${path} responded with ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function fetchSystemStats(): Promise<SystemStats> {
  return getJson<SystemStats>('/api/system');
}

export function fetchAppStatuses(): Promise<AppStatus[]> {
  return getJson<AppStatus[]>('/api/apps');
}
