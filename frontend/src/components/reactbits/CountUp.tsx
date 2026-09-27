import React, { useEffect, useState, useRef } from 'react';

interface CountUpProps {
  to: number;
  from?: number;
  duration?: number; // in seconds
  decimals?: number;
  prefix?: string;
  suffix?: string;
  separator?: string;
  className?: string;
}

export const CountUp: React.FC<CountUpProps> = ({
  to,
  from = 0,
  duration = 1.2,
  decimals = 0,
  prefix = '',
  suffix = '',
  separator = ',',
  className = '',
}) => {
  const [currentValue, setCurrentValue] = useState(from);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    startTimeRef.current = null;

    const easeOutExpo = (t: number): number => {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    };

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / (duration * 1000), 1);
      const easedProgress = easeOutExpo(progress);

      const nextVal = from + (to - from) * easedProgress;
      setCurrentValue(nextVal);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setCurrentValue(to);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [to, from, duration]);

  const formatNumber = (val: number): string => {
    const fixed = val.toFixed(decimals);
    const parts = fixed.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    return parts.join('.');
  };

  return (
    <span className={`count-up ${className}`}>
      {prefix}
      {formatNumber(currentValue)}
      {suffix}
    </span>
  );
};
