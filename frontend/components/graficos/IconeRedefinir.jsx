// Grafismo próprio (traço simples, currentColor) — ícone de biblioteca é
// proibido no site público (DESIGN.md); seta circular pra "redefinir".
export default function IconeRedefinir({ tamanho = 20, className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={tamanho}
      height={tamanho}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 4.5v5.5h5.5" />
      <path d="M4.6 10A8 8 0 1 1 6 16" />
    </svg>
  );
}
