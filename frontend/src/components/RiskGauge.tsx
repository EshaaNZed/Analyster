import React from 'react';
import { CountUp } from './reactbits/CountUp';

interface RiskGaugeProps {
  score: number; // 0 to 100
  tier: 'Low' | 'Medium' | 'High';
  xgbProb?: number;
  rfProb?: number;
  severityScore?: number;
  delayNoticePoints?: number;
  size?: number;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({
  score,
  tier,
  xgbProb = 0,
  rfProb = 0,
  severityScore,
  delayNoticePoints,
  size = 200,
}) => {
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Semicircular arc (180 degrees)
  const arcLength = circumference / 2;
  const strokeDashoffset = arcLength - (score / 100) * arcLength;

  const getColor = (s: number) => {
    if (s < 40) return { stroke: '#10b981', glow: 'rgba(16, 185, 129, 0.4)', text: 'text-emerald' };
    if (s < 70) return { stroke: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)', text: 'text-amber' };
    return { stroke: '#ef4444', glow: 'rgba(239, 68, 68, 0.5)', text: 'text-rose' };
  };

  const currentTheme = getColor(score);

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div style={{ position: 'relative', width: size, height: size / 1.7, display: 'flex', justifyContent: 'center' }}>
        <svg
          width={size}
          height={size}
          style={{ transform: 'rotate(-180deg)', overflow: 'visible' }}
        >
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Animated Value Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={currentTheme.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.4s ease',
              filter: `drop-shadow(0 0 10px ${currentTheme.glow})`,
            }}
          />
        </svg>

        {/* Center Readout */}
        <div
          style={{
            position: 'absolute',
            bottom: '4px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#f0f0f5', lineHeight: 1 }}>
            <CountUp to={score} duration={1.2} />
            <span style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>/100</span>
          </div>
          <div
            style={{
              marginTop: '6px',
              padding: '2px 10px',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              background: score < 40 ? 'rgba(16, 185, 129, 0.15)' : score < 70 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: currentTheme.stroke,
              border: `1px solid ${currentTheme.stroke}40`,
            }}
          >
            {tier} Risk
          </div>
        </div>
      </div>

      {/* Model Probability Breakdown */}
      <div style={{ display: 'flex', gap: '16px', marginTop: '14px', width: '100%', justifyContent: 'center' }}>
        {severityScore !== undefined && (
          <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Severity 65%</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#e2e8f0', fontFamily: 'var(--font-mono)' }}>
              {severityScore}
            </div>
          </div>
        )}
        {delayNoticePoints !== undefined && delayNoticePoints > 0 && (
          <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Late notice</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#e2e8f0', fontFamily: 'var(--font-mono)' }}>
              +{delayNoticePoints}
            </div>
          </div>
        )}
        <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Pattern 35%</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#e2e8f0', fontFamily: 'var(--font-mono)' }}>
            {(xgbProb * 100).toFixed(1)}%
          </div>
        </div>
        <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Calibrated RF</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#e2e8f0', fontFamily: 'var(--font-mono)' }}>
            {(rfProb * 100).toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
};
