const SEGMENTOS = [
  [0, 34], [46, 18], [76, 52], [140, 10],
  [162, 40], [214, 22], [248, 58], [318, 14], [344, 56],
];

export default function Divisor({ orientacao = 'horizontal', espessura = 3, className = '' }) {
  const vertical = orientacao === 'vertical';
  return (
    <svg
      viewBox={vertical ? `0 0 ${espessura} 400` : `0 0 400 ${espessura}`}
      preserveAspectRatio="none"
      className={className}
      style={vertical ? { width: espessura, height: '100%' } : { width: '100%', height: espessura }}
      fill="currentColor"
      aria-hidden="true"
    >
      {SEGMENTOS.map(([inicio, comprimento]) =>
        vertical ? (
          <rect key={inicio} x="0" y={inicio} width={espessura} height={comprimento} />
        ) : (
          <rect key={inicio} x={inicio} y="0" width={comprimento} height={espessura} />
        )
      )}
    </svg>
  );
}
