import { Pencil } from "lucide-react";

// Botão "Editar" das tabelas de submissões (Recebimento, Avaliação,
// Resultado) — abre o editor em tela cheia numa nova aba.
export default function LinkEditarSubmissao({ edicaoId, submissao, className }) {
  return (
    <a
      href={`/editor/edicoes/${edicaoId}/submissoes/${submissao.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      aria-label={`Editar "${submissao.titulo}" em nova aba`}
      title="Editar em nova aba"
    >
      <Pencil size={16} strokeWidth={1.5} aria-hidden="true" />
    </a>
  );
}
