// Include padrão de Submissao, compartilhado entre o painel admin de
// recebimento e a listagem "minhas submissões" da área do participante.
const INCLUDE_PADRAO = {
  modalidadeSubmissao: { select: { id: true, nome: true } },
  areaSubmissao: { select: { id: true, titulo: true } },
  autores: { orderBy: { ordem: "asc" } },
};

module.exports = INCLUDE_PADRAO;
