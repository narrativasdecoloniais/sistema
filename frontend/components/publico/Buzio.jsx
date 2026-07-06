// Acento gráfico recorrente (marcador de programação, indicador de rolagem,
// detalhe de hover, favicon) — não é a logo, só a casca estilizada do búzio.
export default function Buzio({ className }) {
  return (
    <svg viewBox="0 0 100 130" className={className} aria-hidden="true" focusable="false">
      <path
        d="M50,3 C82,3 97,38 97,66 C97,102 76,127 50,127 C24,127 3,102 3,66 C3,38 18,3 50,3 Z"
        fill="currentColor"
      />
      <path
        d="M50,18 L45,30 L50,38 L44,50 L50,58 L44,70 L50,78 L45,90 L50,110"
        stroke="#fff"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
