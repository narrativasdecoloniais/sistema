// Sincroniza uma lista aninhada (ex.: pessoas de uma atividade, realizadores
// de uma edição) com o banco: apaga o que saiu da lista, atualiza o que tem
// id, cria o que não tem. `montarCampos` pode ser assíncrona (upload de
// imagem); `aoRemover(itemExistente)`, se informado, roda antes do
// deleteMany — usado para limpar a imagem do storage dos itens removidos.
async function sincronizarLista(modelo, chaveEstrangeira, paiId, itens, montarCampos, aoRemover) {
  const existentes = await modelo.findMany({ where: { [chaveEstrangeira]: paiId } });
  const idsRecebidos = itens.filter((item) => item.id).map((item) => item.id);
  const removidos = existentes.filter((item) => !idsRecebidos.includes(item.id));

  if (aoRemover) {
    await Promise.all(removidos.map((item) => aoRemover(item)));
  }

  const operacoes = [];
  if (removidos.length > 0) {
    operacoes.push(modelo.deleteMany({ where: { id: { in: removidos.map((item) => item.id) } } }));
  }

  for (const [indice, item] of itens.entries()) {
    const campos = await montarCampos(item, indice);
    operacoes.push(
      item.id
        ? modelo.update({ where: { id: item.id }, data: campos })
        : modelo.create({ data: { ...campos, [chaveEstrangeira]: paiId } })
    );
  }

  return operacoes;
}

module.exports = sincronizarLista;
