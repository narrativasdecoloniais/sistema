export default function Carimbo({ className = '', rotacao = 0, preenchido = false }) {
  return (
    <svg
      viewBox="0 0 200 64"
      preserveAspectRatio="none"
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        transform: rotacao ? `rotate(${rotacao}deg)` : undefined,
        pointerEvents: 'none',
      }}
      fill={preenchido ? 'currentColor' : 'none'}
      stroke={preenchido ? 'none' : 'currentColor'}
      strokeWidth={preenchido ? undefined : '2.5'}
      aria-hidden="true"
    >
      <path
        vectorEffect="non-scaling-stroke"
        strokeLinecap="square"
        d="M6 5 C 58 2.5, 138 6.5, 195 4
           C 197.5 20, 194.5 42, 196 59
           C 142 61.5, 64 58, 5 60
           C 2.8 45, 5.5 21, 6 5 Z"
      />
    </svg>
  );
}
