import React from 'react';

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  borderWidth?: number;
  anchor?: number;
  colorFrom?: string;
  colorTo?: string;
  delay?: number;
}

export const BorderBeam: React.FC<BorderBeamProps> = ({
  className = '',
  size = 200,
  duration = 8,
  anchor = 90,
  borderWidth = 1.5,
  colorFrom = '#6366f1',
  colorTo = '#ec4899',
  delay = 0,
}) => {
  return (
    <div
      style={
        {
          '--size': `${size}px`,
          '--duration': `${duration}s`,
          '--anchor': `${anchor}%`,
          '--border-width': `${borderWidth}px`,
          '--color-from': colorFrom,
          '--color-to': colorTo,
          '--delay': `-${delay}s`,
        } as React.CSSProperties
      }
      className={`border-beam-container ${className}`}
    >
      <div className="border-beam-glow" />
      <style>{`
        .border-beam-container {
          pointer-events: none;
          position: absolute;
          inset: 0;
          border-radius: inherit;
          border: var(--border-width) solid transparent;
          mask: linear-gradient(transparent, transparent), linear-gradient(white, white);
          mask-clip: padding-box, border-box;
          mask-composite: intersect;
          -webkit-mask: linear-gradient(transparent, transparent), linear-gradient(white, white);
          -webkit-mask-clip: padding-box, border-box;
          -webkit-mask-composite: source-in;
        }

        .border-beam-glow {
          position: absolute;
          aspect-ratio: 1;
          width: var(--size);
          offset-path: rect(0 auto auto 0 round calc(var(--size) / 2));
          background: linear-gradient(to left, var(--color-from), var(--color-to), transparent);
          opacity: 0.8;
          animation: border-beam-anim var(--duration) infinite linear;
          animation-delay: var(--delay);
        }

        @keyframes border-beam-anim {
          to {
            offset-distance: 100%;
          }
        }
      `}</style>
    </div>
  );
};
