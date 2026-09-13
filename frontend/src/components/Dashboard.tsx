import { useEffect, useState } from 'react';
import { fetchAppStatuses, fetchSystemStats } from '../api/client';
import type { AppStatus, SystemStats } from '../api/types';
import { formatBytes } from '../utils/format';
import { Gauge } from './Gauge';
import { AppCard } from './AppCard';
import './Dashboard.css';

const POLL_INTERVAL_MS = 600000;

export function Dashboard() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [apps, setApps] = useState<AppStatus[] | null>(null);
  const [appsError, setAppsError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const nextStats = await fetchSystemStats();
        if (cancelled) return;
        setStats(nextStats);
        setConnected(true);
        setLastUpdated(new Date());
      } catch {
        if (!cancelled) setConnected(false);
      }

      try {
        const nextApps = await fetchAppStatuses();
        if (cancelled) return;
        setApps(nextApps);
        setAppsError(null);
      } catch (err) {
        if (!cancelled) {
          setAppsError(err instanceof Error ? err.message : 'Failed to load app statuses');
        }
      }
    }

    poll();
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const ramPercent = stats ? (stats.ramUsedBytes / stats.ramTotalBytes) * 100 : null;
  const storagePercent = stats ? (stats.storageUsedBytes / stats.storageTotalBytes) * 100 : null;

  return (
    <div className="page">
      <header>
        <h1>Raspberry Pi Health</h1>
        <div className="status-line">
          <span className={`dot ${connected ? 'dot--up' : 'dot--down'}`} />
          <span>{connected ? 'connected' : 'disconnected'}</span>
          {lastUpdated && <span className="updated-at">updated {lastUpdated.toLocaleTimeString()}</span>}
        </div>
      </header>

      <section className="gauges">
        <Gauge
          label="CPU Load"
          value={stats?.cpuLoadPercent ?? null}
          max={100}
          displayValue={stats ? `${stats.cpuLoadPercent.toFixed(0)}%` : ''}
        />
        <Gauge
          label="CPU Temp"
          value={stats?.cpuTempCelsius ?? null}
          max={85}
          displayValue={stats?.cpuTempCelsius ? `${stats.cpuTempCelsius.toFixed(0)}°C` : ''}
        />
        <Gauge
          label="RAM"
          value={ramPercent}
          max={100}
          displayValue={ramPercent ? `${ramPercent.toFixed(0)}%` : ''}
          subText={stats ? `${formatBytes(stats.ramUsedBytes)} / ${formatBytes(stats.ramTotalBytes)}` : undefined}
        />
        <Gauge
          label="Storage"
          value={storagePercent}
          max={100}
          displayValue={storagePercent ? `${storagePercent.toFixed(0)}%` : ''}
          subText={
            stats ? `${formatBytes(stats.storageUsedBytes)} / ${formatBytes(stats.storageTotalBytes)}` : undefined
          }
        />
      </section>

      <section className="apps-section">
        <h2>Apps</h2>
        <div className="apps-grid">
          {apps === null && appsError === null && (
            <p className="apps-placeholder">Waiting for /api/apps…</p>
          )}
          {appsError !== null && (
            <p className="apps-error">Couldn't check app statuses: {appsError}</p>
          )}
          {apps?.map((app) => (
            <AppCard key={app.name} app={app} />
          ))}
        </div>
      </section>
    </div>
  );
}
