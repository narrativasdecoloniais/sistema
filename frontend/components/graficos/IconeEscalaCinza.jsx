// Grafismo próprio (traço simples, currentColor) — ícone de biblioteca é
// proibido no site público (DESIGN.md); barras em degradê de opacidade
// evocam a escala de cinza (preto sólido → contorno vazio).
export default function IconeEscalaCinza({ tamanho = 20, className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={tamanho}
      height={tamanho}
      className={className}
      aria-hidden="true"
    >
      <rect x="2.5" y="4" width="4" height="16" rx="1" fill="currentColor" />
      <rect x="8.2" y="4" width="4" height="16" rx="1" fill="currentColor" opacity="0.65" />
      <rect x="13.9" y="4" width="4" height="16" rx="1" fill="currentColor" opacity="0.3" />
      <rect
        x="19.6"
        y="4"
        width="1.9"
        height="16"
        rx="1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}
