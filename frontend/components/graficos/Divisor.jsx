const SEGMENTOS = [
  [0, 34], [46, 18], [76, 52], [140, 10],
  [162, 40], [214, 22], [248, 58], [318, 14], [344, 56],
];

export default function Divisor({ orientacao = 'horizontal', className = '' }) {
  const vertical = orientacao === 'vertical';
  return (
    <svg
      viewBox={vertical ? '0 0 3 400' : '0 0 400 3'}
      preserveAspectRatio="none"
      className={className}
      style={vertical ? { width: 3, height: '100%' } : { width: '100%', height: 3 }}
      fill="currentColor"
      aria-hidden="true"
    >
      {SEGMENTOS.map(([inicio, comprimento]) =>
        vertical ? (
          <rect key={inicio} x="0" y={inicio} width="3" height={comprimento} />
        ) : (
          <rect key={inicio} x={inicio} y="0" width={comprimento} height="3" />
        )
      )}
    </svg>
  );
}
