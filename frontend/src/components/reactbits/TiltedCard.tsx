import React, { useRef, useState } from 'react';

interface TiltedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  maxTilt?: number;
  scale?: number;
  className?: string;
}

export const TiltedCard: React.FC<TiltedCardProps> = ({
  children,
  maxTilt = 8,
  scale = 1.02,
  className = '',
  style,
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -maxTilt;
    const rotateY = ((x - centerX) / centerX) * maxTilt;

    setTransform(`perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(${scale}, ${scale}, ${scale})`);
    setGlare({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.15,
    });
  };

  const handleMouseLeave = () => {
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
    setGlare({ x: 50, y: 50, opacity: 0 });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`tilted-card ${className}`}
      style={{
        transform,
        transition: 'transform 0.15s ease-out',
        transformStyle: 'preserve-3d',
        position: 'relative',
        borderRadius: '16px',
        overflow: 'hidden',
        ...style,
      }}
      {...props}
    >
      {/* Specular glare overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.2) 0%, transparent 60%)`,
          opacity: glare.opacity,
          transition: 'opacity 0.2s ease',
          zIndex: 2,
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  );
};
