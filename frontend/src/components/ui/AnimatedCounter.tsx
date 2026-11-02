import React, { useEffect, useState } from 'react';
import { useInView } from 'framer-motion';

export interface AnimatedCounterProps {
  value: number | string;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1.5,
  prefix = '',
  suffix = '',
  className = '',
}) => {
  const ref = React.useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [displayValue, setDisplayValue] = useState<number>(0);

  // If numeric string or number, parse numeric target
  const numericValue = typeof value === 'number' ? value : parseInt(value.replace(/[^0-9]/g, ''), 10) || 0;
  const isStringValue = typeof value === 'string' && isNaN(parseInt(value.replace(/[^0-9]/g, ''), 10));

  useEffect(() => {
    if (!isInView || isStringValue) return;

    const end = numericValue;
    const totalFrames = Math.round(duration * 60);
    let frame = 0;

    const timer = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      // Ease out cubic
      const current = Math.round(end * (1 - Math.pow(1 - progress, 3)));
      setDisplayValue(current);

      if (frame >= totalFrames) {
        clearInterval(timer);
        setDisplayValue(end);
      }
    }, 1000 / 60);

    return () => clearInterval(timer);
  }, [isInView, numericValue, duration, isStringValue]);

  if (isStringValue) {
    return <span ref={ref} className={className}>{value}</span>;
  }

  return (
    <span ref={ref} className={className}>
      {prefix}
      {isInView ? displayValue.toLocaleString('en-IN') : '0'}
      {suffix || (typeof value === 'string' && value.includes('+') ? '+' : '')}
    </span>
  );
};
