'use client';

import ParticleCanvas from '../particles/ParticleCanvas';

export default function LandingCanvas() {
  return (
    <ParticleCanvas
      particleCount={120}
      color="rgba(99, 102, 241, 0.2)"
      mouseInteraction
      gridLines
      pulse
    />
  );
}
