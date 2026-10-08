// Aviso da atividade (Atividade.destaque) e onde ele aparece
// (Atividade.destaqueLocais, enum LocalAvisoAtividade do schema).
export const LOCAIS_AVISO_ATIVIDADE = [
  { valor: "PROGRAMACAO", rotulo: "Programação do site", descricao: "cartão da atividade" },
  { valor: "PAGINA_ATIVIDADE", rotulo: "Página da atividade", descricao: "logo abaixo do título" },
  { valor: "INSCRICAO", rotulo: "Inscrição do participante", descricao: "cartão e \"Ver detalhes\" da atividade" },
  { valor: "COMPROVANTE", rotulo: "Comprovante de inscrição", descricao: "e-mail, tela e impressão" },
];

export const TODOS_LOCAIS_AVISO = LOCAIS_AVISO_ATIVIDADE.map((local) => local.valor);

// Texto do aviso a mostrar em `local`, ou null. Sem destaqueLocais (resposta
// antiga, anterior à coluna) vale o padrão do banco: todos os lugares.
export function avisoAtividade(atividade, local) {
  if (!atividade?.destaque) return null;
  const locais = atividade.destaqueLocais || TODOS_LOCAIS_AVISO;
  return locais.includes(local) ? atividade.destaque : null;
}
