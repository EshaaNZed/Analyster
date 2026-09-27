import React, { useRef, useState } from 'react';

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  borderColor?: string;
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = '',
  spotlightColor = 'rgba(99, 102, 241, 0.15)',
  borderColor = 'rgba(99, 102, 241, 0.4)',
  style,
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseEnter = () => setOpacity(1);
  const handleMouseLeave = () => setOpacity(0);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`spotlight-card ${className}`}
      style={{
        position: 'relative',
        borderRadius: '16px',
        background: 'rgba(20, 20, 32, 0.7)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        overflow: 'hidden',
        transition: 'border-color 0.3s ease, box-shadow 0.3s ease, transform 0.2s ease',
        ...style,
      }}
      {...props}
    >
      {/* Dynamic cursor follow spotlight */}
      <div
        style={{
          pointerEvents: 'none',
          position: 'absolute',
          inset: 0,
          opacity,
          transition: 'opacity 0.4s ease',
          background: `radial-gradient(450px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 60%)`,
        }}
      />
      {/* Dynamic border beam glow */}
      <div
        style={{
          pointerEvents: 'none',
          position: 'absolute',
          inset: 0,
          opacity,
          transition: 'opacity 0.3s ease',
          borderRadius: 'inherit',
          border: `1px solid ${borderColor}`,
          maskImage: `radial-gradient(280px circle at ${position.x}px ${position.y}px, black 30%, transparent 80%)`,
          WebkitMaskImage: `radial-gradient(280px circle at ${position.x}px ${position.y}px, black 30%, transparent 80%)`,
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  );
};
