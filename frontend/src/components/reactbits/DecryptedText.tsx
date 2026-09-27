import React, { useEffect, useState, useRef } from 'react';

interface DecryptedTextProps {
  text: string;
  speed?: number;
  maxIterations?: number;
  sequential?: boolean;
  revealDirection?: 'start' | 'end' | 'center';
  useOriginalCharsOnly?: boolean;
  characters?: string;
  className?: string;
  parentClassName?: string;
  animateOn?: 'view' | 'hover';
}

export const DecryptedText: React.FC<DecryptedTextProps> = ({
  text,
  speed = 40,
  maxIterations = 10,
  sequential = true,
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=<>?/',
  className = '',
  parentClassName = '',
  animateOn = 'view',
}) => {
  const [displayText, setDisplayText] = useState(text);
  const [isHovering, setIsHovering] = useState(false);
  const [isScrambling, setIsScrambling] = useState(false);
  const iterationRef = useRef(0);
  const intervalRef = useRef<any>(null);

  const startAnimation = () => {
    if (isScrambling) return;
    setIsScrambling(true);
    iterationRef.current = 0;

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setDisplayText(() => {
        return text
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' ';
            if (sequential) {
              if (index < iterationRef.current / 2) {
                return text[index];
              }
            } else {
              if (iterationRef.current >= maxIterations) {
                return text[index];
              }
            }
            return characters[Math.floor(Math.random() * characters.length)];
          })
          .join('');
      });

      iterationRef.current += 1;

      if (iterationRef.current > (sequential ? text.length * 2 : maxIterations)) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setDisplayText(text);
        setIsScrambling(false);
      }
    }, speed);
  };

  useEffect(() => {
    if (animateOn === 'view') {
      startAnimation();
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text]);

  const handleMouseEnter = () => {
    if (animateOn === 'hover') {
      setIsHovering(true);
      startAnimation();
    }
  };

  const handleMouseLeave = () => {
    if (animateOn === 'hover') {
      setIsHovering(false);
    }
  };

  return (
    <span
      className={`decrypted-text-wrapper ${parentClassName}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ display: 'inline-block', cursor: animateOn === 'hover' ? 'pointer' : 'default' }}
    >
      <span className={className}>{displayText}</span>
    </span>
  );
};
