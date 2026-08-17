'use client';

import { useEffect, useState } from 'react';
import { motion, type Variants } from 'framer-motion';

interface TypewriterProps {
  texts: string[];
  typeSpeed?: number;
  holdTime?: number;
  deleteSpeed?: number;
  startDelay?: number;
  showCursor?: boolean;
  cursorChar?: string;
  color?: string;
  cursorColor?: string;
  className?: string;
}

export default function Typewriter({
  texts,
  typeSpeed = 45,
  holdTime = 1400,
  deleteSpeed = 30,
  startDelay = 0,
  showCursor = true,
  cursorChar = '|',
  color,
  cursorColor,
  className,
}: TypewriterProps) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [started, setStarted] = useState(startDelay === 0);

  useEffect(() => {
    if (startDelay === 0) return;
    const t = setTimeout(() => setStarted(true), startDelay);
    return () => clearTimeout(t);
  }, [startDelay]);

  useEffect(() => {
    if (!started || texts.length === 0) return;

    const currentText = texts[currentTextIndex] ?? '';
    let timeout: ReturnType<typeof setTimeout> | undefined;

    if (isDeleting) {
      if (displayText === '') {
        setIsDeleting(false);
        setCurrentTextIndex((prev) => (prev + 1) % texts.length);
        setCurrentIndex(0);
      } else {
        timeout = setTimeout(() => setDisplayText((prev) => prev.slice(0, -1)), deleteSpeed);
      }
    } else if (currentIndex < currentText.length) {
      timeout = setTimeout(() => {
        setDisplayText((prev) => prev + currentText[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, typeSpeed);
    } else if (texts.length > 1) {
      timeout = setTimeout(() => setIsDeleting(true), holdTime);
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [started, currentIndex, displayText, isDeleting, currentTextIndex, texts, typeSpeed, deleteSpeed, holdTime]);

  const cursorVariants: Variants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: { duration: 0.01, repeat: Infinity, repeatDelay: 0.4, repeatType: 'reverse' },
    },
  };

  return (
    <span className={className} style={{ color }}>
      {displayText}
      {showCursor && (
        <motion.span
          variants={cursorVariants}
          initial="initial"
          animate="animate"
          style={{ color: cursorColor ?? color, marginLeft: '0.1em' }}
        >
          {cursorChar}
        </motion.span>
      )}
    </span>
  );
}
