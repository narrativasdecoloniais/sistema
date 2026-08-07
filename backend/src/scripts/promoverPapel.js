#!/usr/bin/env node
// Promove um usuário existente a um ou mais papéis (roles), sem duplicar os
// que ele já possui.
//
// Uso:
//   node src/scripts/promoverPapel.js <email> <PAPEL...>
// Exemplo:
//   node src/scripts/promoverPapel.js alethoalves@gmail.com ADMIN

require("../config/env");
const prisma = require("../config/prisma");

const PAPEIS_VALIDOS = ["PARTICIPANTE", "AVALIADOR", "ORGANIZADOR", "ADMIN"];

async function main() {
  const [email, ...papeisArgs] = process.argv.slice(2);

  if (!email || papeisArgs.length === 0) {
    console.error("Uso: node src/scripts/promoverPapel.js <email> <PAPEL...>");
    console.error(`Papéis válidos: ${PAPEIS_VALIDOS.join(", ")}`);
    process.exitCode = 1;
    return;
  }

  const papeisSolicitados = papeisArgs.map((papel) => papel.toUpperCase());
  const papeisInvalidos = papeisSolicitados.filter((papel) => !PAPEIS_VALIDOS.includes(papel));
  if (papeisInvalidos.length > 0) {
    console.error(`Papel(éis) inválido(s): ${papeisInvalidos.join(", ")}`);
    console.error(`Papéis válidos: ${PAPEIS_VALIDOS.join(", ")}`);
    process.exitCode = 1;
    return;
  }

  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario) {
    console.error(`Usuário não encontrado para o e-mail: ${email}`);
    process.exitCode = 1;
    return;
  }

  const papeisAtualizados = Array.from(new Set([...usuario.papeis, ...papeisSolicitados]));

  if (papeisAtualizados.length === usuario.papeis.length) {
    console.log(`"${usuario.nome}" (${email}) já possui todos os papéis solicitados.`);
    console.log(`Papéis atuais: ${usuario.papeis.join(", ")}`);
    return;
  }

  const atualizado = await prisma.usuario.update({
    where: { email },
    data: { papeis: papeisAtualizados },
  });

  console.log(`"${atualizado.nome}" (${email}) atualizado com sucesso.`);
  console.log(`Papéis: ${atualizado.papeis.join(", ")}`);
}

main()
  .catch((erro) => {
    console.error("Erro ao promover usuário:", erro.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
