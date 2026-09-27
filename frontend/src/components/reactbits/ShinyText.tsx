import React from 'react';

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const ShinyText: React.FC<ShinyTextProps> = ({
  text,
  disabled = false,
  speed = 4,
  className = '',
  style = {},
}) => {
  const animationDuration = `${speed}s`;

  return (
    <span
      className={`shiny-text ${className}`}
      style={{
        background: disabled
          ? 'currentColor'
          : 'linear-gradient(120deg, rgba(255, 255, 255, 0.4) 30%, rgba(255, 255, 255, 1) 50%, rgba(255, 255, 255, 0.4) 70%)',
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: disabled ? 'inherit' : 'transparent',
        animation: disabled ? 'none' : `shine ${animationDuration} linear infinite`,
        display: 'inline-block',
        ...style,
      }}
    >
      {text}
      <style>{`
        @keyframes shine {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
      `}</style>
    </span>
  );
};
