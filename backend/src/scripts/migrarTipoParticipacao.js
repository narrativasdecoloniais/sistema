#!/usr/bin/env node
// Migra o texto livre antigo de AtividadePessoa.tipo para o novo catálogo
// TipoParticipacao: cria um TipoParticipacao para cada valor distinto já
// usado e aponta tipoParticipacaoId de cada pessoa pra ele. Roda antes da
// migration que torna tipoParticipacaoId obrigatório e remove a coluna tipo.
//
// Uso:
//   node src/scripts/migrarTipoParticipacao.js

require("../config/env");
const prisma = require("../config/prisma");

async function main() {
  const pessoas = await prisma.atividadePessoa.findMany({
    where: { tipoParticipacaoId: null },
    select: { id: true, tipo: true },
  });

  console.log(`Pessoas para migrar: ${pessoas.length}`);

  const valoresDistintos = Array.from(new Set(pessoas.map((pessoa) => pessoa.tipo.trim())));
  const tipoParticipacaoPorNome = new Map();

  for (const nome of valoresDistintos) {
    const tipo = await prisma.tipoParticipacao.upsert({
      where: { nome },
      update: {},
      create: { nome },
    });
    tipoParticipacaoPorNome.set(nome, tipo.id);
    console.log(`  catálogo: "${nome}" -> ${tipo.id}`);
  }

  for (const pessoa of pessoas) {
    const tipoParticipacaoId = tipoParticipacaoPorNome.get(pessoa.tipo.trim());
    await prisma.atividadePessoa.update({
      where: { id: pessoa.id },
      data: { tipoParticipacaoId },
    });
    console.log(`  pessoa ${pessoa.id} -> tipoParticipacaoId ${tipoParticipacaoId}`);
  }

  console.log("Migração concluída.");
}

main()
  .catch((erro) => {
    console.error("Erro ao migrar tipo de participação:", erro);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
