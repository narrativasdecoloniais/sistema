// Grafismo próprio (traço simples, currentColor) — ícone de biblioteca é
// proibido no site público (DESIGN.md); disco dividido na horizontal (metade
// superior sólida) — diferenciado do disco de IconeAcessibilidade (dividido
// na vertical) pra não confundir os dois no mesmo painel.
export default function IconeContrasteAuto({ tamanho = 20, className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={tamanho}
      height={tamanho}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3.3 10.5a9 9 0 0 1 17.4 0z" fill="currentColor" stroke="none" />
    </svg>
  );
}
