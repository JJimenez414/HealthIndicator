import './Gauge.css';

interface GaugeProps {
  label: string;
  value: number | null;
  max: number;
  displayValue: string;
  subText?: string;
}

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function levelForPercent(percent: number): 'ok' | 'warn' | 'critical' {
  if (percent >= 90) return 'critical';
  if (percent >= 70) return 'warn';
  return 'ok';
}

export function Gauge({ label, value, max, displayValue, subText }: GaugeProps) {
  const percent = value === null ? 0 : Math.min(100, Math.max(0, (value / max) * 100));
  const offset = CIRCUMFERENCE * (1 - percent / 100);
  const level = value === null ? 'unknown' : levelForPercent(percent);

  return (
    <div className="gauge-card">
      <svg viewBox="0 0 120 120" className="gauge">
        <circle className="gauge-track" cx="60" cy="60" r={RADIUS} />
        <circle
          className={`gauge-value gauge-value--${level}`}
          cx="60"
          cy="60"
          r={RADIUS}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={value === null ? CIRCUMFERENCE : offset}
        />
      </svg>
      <div className="gauge-label">
        <div className="gauge-number">{value === null ? '—' : displayValue}</div>
        <div className="gauge-title">{label}</div>
        {subText && <div className="gauge-sub">{subText}</div>}
      </div>
    </div>
  );
}
