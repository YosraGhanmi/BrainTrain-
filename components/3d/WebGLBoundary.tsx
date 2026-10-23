'use client';

import { Component, useState, type ReactNode } from 'react';

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    // Hand the probe context straight back: browsers cap live contexts.
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return !!gl;
  } catch {
    return false;
  }
}

class CanvasErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn('3D scene disabled:', error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/**
 * Renders the 3D scene only where WebGL is actually available, and swaps in
 * `fallback` if rendering the scene throws, instead of taking the whole
 * surrounding section down with it.
 *
 * The up-front probe is needed because react-three-fiber creates its WebGL
 * context inside an async effect: when that fails (blocklisted GPU drivers,
 * hardware acceleration disabled) it surfaces as an unhandled rejection that
 * never reaches an error boundary.
 */
export default function WebGLBoundary({ fallback = null, children }: { fallback?: ReactNode; children: ReactNode }) {
  // Only ever mounted client-side (the scenes load with ssr: false).
  const [supported] = useState(detectWebGL);
  if (!supported) return <>{fallback}</>;
  return <CanvasErrorBoundary fallback={fallback}>{children}</CanvasErrorBoundary>;
}
