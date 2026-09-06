// Grafismo próprio (traço simples, currentColor) — ícone de biblioteca é
// proibido no site público (DESIGN.md); um "A" sólido pra "fonte legível".
export default function IconeFonteLegivel({ tamanho = 20, className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={tamanho}
      height={tamanho}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 20 11.3 4.5a.7.7 0 0 1 1.4 0L18 20" />
      <path d="M8.4 14.5h7.2" />
    </svg>
  );
}
