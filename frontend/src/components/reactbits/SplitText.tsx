import React from 'react';
import { motion } from 'framer-motion';

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  animationFrom?: { opacity: number; transform: string };
  animationTo?: { opacity: number; transform: string };
  easing?: [number, number, number, number] | string;
  threshold?: number;
  rootMargin?: string;
  textAlign?: 'left' | 'center' | 'right';
}

export const SplitText: React.FC<SplitTextProps> = ({
  text,
  className = '',
  delay = 35,
  textAlign = 'left',
}) => {
  const words = text.split(' ');

  return (
    <span
      className={`split-text-container ${className}`}
      style={{
        display: 'inline-flex',
        flexWrap: 'wrap',
        justifyContent: textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start',
        gap: '0.28em',
      }}
    >
      {words.map((word, wordIndex) => (
        <span key={wordIndex} style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
          {word.split('').map((char, charIndex) => {
            const index = wordIndex * 5 + charIndex;
            return (
              <motion.span
                key={charIndex}
                initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{
                  duration: 0.45,
                  delay: (index * delay) / 1000,
                  ease: [0.2, 0.65, 0.3, 0.9],
                }}
                style={{ display: 'inline-block' }}
              >
                {char}
              </motion.span>
            );
          })}
        </span>
      ))}
    </span>
  );
};
