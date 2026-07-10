export default function MarcaRodape({ tamanho = 28, className = '' }) {
  return (
    <svg
      viewBox="0 0 164 182"
      width={tamanho}
      height={(tamanho * 182) / 164}
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <use href="#buzio-simbolo-1" width="100%" height="100%" />
    </svg>
  );
}
