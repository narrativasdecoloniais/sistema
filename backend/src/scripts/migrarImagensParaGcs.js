#!/usr/bin/env node
// Migra imagens salvas como base64 direto no banco (padrão antigo) para o
// Google Cloud Storage. Rodar manualmente uma vez por ambiente — primeiro em
// dev, depois em produção (com backup do banco antes, já que a operação
// sobrescreve a coluna e não há como reverter automaticamente).
//
// Uso:
//   node src/scripts/migrarImagensParaGcs.js

require("../config/env");
const fs = require("fs");
const path = require("path");
const prisma = require("../config/prisma");
const storageService = require("../services/storage.service");

const ARQUIVO_LOG = path.join(__dirname, "..", "..", "migracao-imagens.log");

function registrarLog(linha) {
  fs.appendFileSync(ARQUIVO_LOG, `${new Date().toISOString()} ${linha}\n`);
}

async function migrarUsuarios() {
  const usuarios = await prisma.usuario.findMany({
    where: { foto: { startsWith: "data:image/" } },
    select: { id: true, foto: true },
  });

  console.log(`Usuários com foto em base64: ${usuarios.length}`);

  for (const usuario of usuarios) {
    const caminho = await storageService.salvarImagemPrivada(usuario.foto, "usuarios");
    registrarLog(`usuarios id=${usuario.id} tinhaBase64=true novoPath=${caminho}`);
    await prisma.usuario.update({ where: { id: usuario.id }, data: { foto: caminho } });
    console.log(`  usuario ${usuario.id} -> ${caminho}`);
  }
}

async function migrarAtividadePessoas() {
  const pessoas = await prisma.atividadePessoa.findMany({
    where: { imagem: { startsWith: "data:image/" } },
    select: { id: true, imagem: true },
  });

  console.log(`Pessoas de atividade com imagem em base64: ${pessoas.length}`);

  for (const pessoa of pessoas) {
    const url = await storageService.salvarImagemPublica(pessoa.imagem, "atividade-pessoas");
    registrarLog(`atividade_pessoas id=${pessoa.id} tinhaBase64=true novaUrl=${url}`);
    await prisma.atividadePessoa.update({ where: { id: pessoa.id }, data: { imagem: url } });
    console.log(`  pessoa ${pessoa.id} -> ${url}`);
  }
}

async function main() {
  console.log(`Log da migração em: ${ARQUIVO_LOG}`);
  await migrarUsuarios();
  await migrarAtividadePessoas();
  console.log("Migração concluída.");
}

main()
  .catch((erro) => {
    console.error("Erro ao migrar imagens:", erro);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
