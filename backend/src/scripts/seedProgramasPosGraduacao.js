#!/usr/bin/env node
// Popula o catálogo global de programas de pós-graduação com 3 registros
// fictícios de exemplo, pra a seção do rodapé (ver Footer.jsx) não nascer
// vazia — o gestor edita/substitui pelo admin (/admin/edicoes/[id]/pos-graduacao).
//
// Uso:
//   node src/scripts/seedProgramasPosGraduacao.js

require("../config/env");
const prisma = require("../config/prisma");

const PROGRAMAS = [
  { nome: "Programa de Pós-Graduação em Educação (PPGE/UnB)" },
  { nome: "Programa de Pós-Graduação em Antropologia Social (PPGAS/UnB)" },
  { nome: "Programa de Pós-Graduação em Estudos Comparados sobre as Américas (PPGECA/UnB)" },
];

async function main() {
  const existentes = await prisma.programaPosGraduacao.count();
  if (existentes > 0) {
    console.log(`Já existem ${existentes} programa(s) cadastrado(s) — nada a fazer.`);
    return;
  }

  for (const programa of PROGRAMAS) {
    const criado = await prisma.programaPosGraduacao.create({ data: programa });
    console.log(`  criado: "${criado.nome}" -> ${criado.id}`);
  }

  console.log("Seed concluído.");
}

main()
  .catch((erro) => {
    console.error("Erro ao popular programas de pós-graduação:", erro);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
