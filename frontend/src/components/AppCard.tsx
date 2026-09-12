import type { AppStatus } from '../api/types';
import { formatUptime } from '../utils/format';
import './AppCard.css';

export function AppCard({ app }: { app: AppStatus }) {
  return (
    <div className="app-card">
      <div className={`app-dot ${app.running ? 'app-dot--up' : 'app-dot--down'}`} />
      <div className="app-info">
        <div className="app-name">{app.name}</div>
        <div className="app-meta">
          {app.running ? `up · ${formatUptime(app.uptimeSeconds)}` : 'stopped'}
        </div>
      </div>
    </div>
  );
}
