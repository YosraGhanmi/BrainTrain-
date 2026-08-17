import type { CSSProperties } from 'react';

interface ShinyPillProps {
  text: string;
  link?: string;
  textColor?: string;
  shineColor?: string;
  speed?: number;
  font?: CSSProperties;
  style?: CSSProperties;
  className?: string;
}

export default function ShinyPill({
  text,
  link,
  textColor = '#0b0c10',
  shineColor = '#7fc8ff',
  speed = 1.5,
  font,
  style,
  className,
}: ShinyPillProps) {
  const shellStyle: CSSProperties = {
    ...style,
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    boxSizing: 'border-box',
    minWidth: 'max-content',
    width: 'auto',
    whiteSpace: 'nowrap',
    ...font,
  };

  const shineLayerStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    whiteSpace: 'nowrap',
    color: shineColor,
    pointerEvents: 'none',
    WebkitMaskImage: 'linear-gradient(to right, transparent 30%, #000 50%, transparent 70%)',
    maskImage: 'linear-gradient(to right, transparent 30%, #000 50%, transparent 70%)',
    WebkitMaskSize: '150% auto',
    maskSize: '150% auto',
    animation: `shinyPillSweep ${speed}s ease-in-out infinite`,
  };

  const content = (
    <div style={shellStyle} className={className}>
      <style
        dangerouslySetInnerHTML={{
          __html: `@keyframes shinyPillSweep {
            0% { -webkit-mask-position: 200%; mask-position: 200%; }
            100% { -webkit-mask-position: -100%; mask-position: -100%; }
          }`,
        }}
      />
      <span style={{ color: textColor }}>{text}</span>
      <span style={shineLayerStyle} aria-hidden="true">
        {text}
      </span>
    </div>
  );

  if (link) {
    return (
      <a href={link} style={{ textDecoration: 'none', display: 'inline-flex' }}>
        {content}
      </a>
    );
  }

  return content;
}
