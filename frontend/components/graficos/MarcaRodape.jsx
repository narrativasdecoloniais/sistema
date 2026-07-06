import Buzio from './Buzio';

export default function MarcaRodape({ tamanho = 28, className = '' }) {
  return (
    <span
      className={className}
      style={{ display: 'inline-flex', alignItems: 'flex-end', gap: tamanho * 0.35 }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 34 32" width={(tamanho * 34) / 32} height={tamanho} fill="currentColor">
        <rect x="0" y="10" width="6" height="22" />
        <rect x="10" y="0" width="6" height="32" />
        <rect x="20" y="16" width="6" height="16" />
        <rect x="30" y="6" width="4" height="26" />
      </svg>
      <Buzio tamanho={tamanho * 0.75} />
    </span>
  );
}
