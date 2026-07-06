"use client";

import { useId } from "react";

export default function TexturaPapel({ opacidade = 0.05, className = '' }) {
  // id do filtro precisa ser único por instância — várias texturas na mesma
  // página colidiriam num único id fixo (url(#grao-papel) pegaria só a primeira).
  const idBase = useId().replace(/:/g, '');
  const filtroId = `grao-papel-${idBase}`;

  return (
    <svg
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        opacity: opacidade,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    >
      <filter id={filtroId}>
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.6 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${filtroId})`} fill="currentColor" />
    </svg>
  );
}
