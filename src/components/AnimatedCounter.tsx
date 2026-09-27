import React, { useEffect, useState } from 'react';
import { formatINR } from '../utils/calculations';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 800,
  className = '',
  prefix = '',
}) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = displayValue;
    const difference = value - startValue;

    if (difference === 0) return;

    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Easing out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      const current = startValue + difference * easeProgress;
      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };

    animationFrameId = window.requestAnimationFrame(step);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [value, duration]);

  return (
    <span className={`tabular-nums ${className}`}>
      {prefix}
      {formatINR(displayValue)}
    </span>
  );
};
