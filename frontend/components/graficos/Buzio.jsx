export default function Buzio({ tamanho = 20, className = '', decorativo = true }) {
  return (
    <svg
      viewBox="0 0 24 32"
      width={tamanho}
      height={(tamanho * 32) / 24}
      className={className}
      fill="currentColor"
      fillRule="evenodd"
      role={decorativo ? undefined : 'img'}
      aria-label={decorativo ? undefined : 'Búzio'}
      aria-hidden={decorativo ? 'true' : undefined}
    >
      <path d="
        M12.3 1.2
        C 18.6 0.8, 22.8 7.4, 23 15.6
        C 23.2 24.4, 18.4 30.9, 12.1 31.1
        C 6.1 31.3, 1.1 25.2, 1 16.4
        C 0.9 8.1, 5.8 1.6, 12.3 1.2
        Z
        M12.2 6.5
        L 11.2 8.2 L 12.4 9.6 L 11.3 11.4 L 12.5 12.9
        L 11.4 14.8 L 12.6 16.3 L 11.5 18.1 L 12.7 19.6
        L 11.7 21.4 L 12.8 22.9 L 12.1 24.8
        L 13.6 23.2 L 12.9 21.6 L 14.0 19.9 L 12.9 18.3
        L 14.1 16.6 L 13.0 15.0 L 14.2 13.2 L 13.1 11.6
        L 14.2 9.9 L 13.2 8.3 L 13.5 6.9
        Z" />
    </svg>
  );
}
