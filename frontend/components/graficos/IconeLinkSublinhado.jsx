// Grafismo próprio (traço simples, currentColor) — ícone de biblioteca é
// proibido no site público (DESIGN.md); elos de corrente sobre um traço
// (sublinhado) pra "links sublinhados".
export default function IconeLinkSublinhado({ tamanho = 20, className = "" }) {
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
      <path d="M9.5 13.5a3.6 3.6 0 0 1 0-5.1l1.8-1.8a3.6 3.6 0 0 1 5.1 5.1l-.9.9" />
      <path d="M14.5 10.5a3.6 3.6 0 0 1 0 5.1l-1.8 1.8a3.6 3.6 0 0 1-5.1-5.1l.9-.9" />
      <path d="M4 19.5h16" />
    </svg>
  );
}
