export interface SystemStats {
  cpuLoadPercent: number;
  cpuTempCelsius: number | null;
  ramTotalBytes: number;
  ramUsedBytes: number;
  storageTotalBytes: number;
  storageUsedBytes: number;
}

export interface AppStatus {
  name: string;
  running: boolean;
  uptimeSeconds: number | null;
}
