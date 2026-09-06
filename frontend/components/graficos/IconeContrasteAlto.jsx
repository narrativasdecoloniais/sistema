// Grafismo próprio (traço simples, currentColor) — ícone de biblioteca é
// proibido no site público (DESIGN.md); quadrado com triângulo sólido no
// canto — leitura comum de "alto contraste" em painéis de acessibilidade.
export default function IconeContrasteAlto({ tamanho = 20, className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={tamanho}
      height={tamanho}
      className={className}
      aria-hidden="true"
    >
      <rect
        x="3.5"
        y="3.5"
        width="17"
        height="17"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M3.5 3.5h17L3.5 20.5Z" fill="currentColor" />
    </svg>
  );
}
