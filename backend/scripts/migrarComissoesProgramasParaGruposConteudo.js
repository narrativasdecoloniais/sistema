// Migra os dados hoje em TipoComissao/Comissao/ComissaoMembro (por edição) e
// ProgramaPosGraduacao (catálogo global) pro novo motor genérico de conteúdo
// GrupoConteudo -> ListaConteudo -> ItemConteudo, associando tudo à edição
// atual (a mais recente por número). Comissao não tem nome próprio hoje —
// cada ListaConteudo criada a partir dela herda o nome do TipoComissao; o
// gestor pode renomear depois pela tela /admin/edicoes/[id]/grupos-conteudo
// (ex. trocar por "Geral"/"Executiva"/"Internacional").
//
// Rodar uma vez, depois da migration que cria GrupoConteudo/ListaConteudo/
// ItemConteudo e antes de remover os models antigos:
//   node backend/scripts/migrarComissoesProgramasParaGruposConteudo.js
//
// Idempotente: não recria um GrupoConteudo se já existir um com o mesmo
// nome nesta edição (evita duplicar se o script rodar mais de uma vez).
// Não apaga nada das tabelas antigas — isso só acontece na migration de
// limpeza, manualmente, depois de conferir os dados na home pública.
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function migrarComissoes(edicaoId) {
  const tipos = await prisma.tipoComissao.findMany({
    include: {
      comissoes: {
        where: { edicaoId },
        include: { membros: { orderBy: { ordem: "asc" } } },
      },
    },
    orderBy: { nome: "asc" },
  });

  let indiceGrupo = 0;
  for (const tipo of tipos) {
    if (tipo.comissoes.length === 0) continue;

    let grupo = await prisma.grupoConteudo.findFirst({ where: { edicaoId, nome: tipo.nome } });
    if (!grupo) {
      grupo = await prisma.grupoConteudo.create({
        data: { edicaoId, nome: tipo.nome, ordem: indiceGrupo },
      });
      console.log(`Grupo "${tipo.nome}" criado (${grupo.id}).`);
    } else {
      console.log(`Grupo "${tipo.nome}" já existia (${grupo.id}).`);
    }
    indiceGrupo += 1;

    let indiceLista = 0;
    for (const comissao of tipo.comissoes) {
      const lista = await prisma.listaConteudo.create({
        data: { grupoConteudoId: grupo.id, nome: tipo.nome, ordem: indiceLista },
      });
      indiceLista += 1;

      if (comissao.membros.length > 0) {
        await prisma.itemConteudo.createMany({
          data: comissao.membros.map((membro, indice) => ({
            listaConteudoId: lista.id,
            nome: membro.nome,
            ordem: indice,
          })),
        });
      }
      console.log(`  Lista "${tipo.nome}" (a partir da comissão ${comissao.id}) ok — ${comissao.membros.length} itens.`);
    }
  }

  return indiceGrupo;
}

async function migrarProgramas(edicaoId, proximoIndiceGrupo) {
  const programas = await prisma.programaPosGraduacao.findMany({ orderBy: { createdAt: "asc" } });
  if (programas.length === 0) return;

  const nomeGrupo = "Programas de Pós-Graduação";
  let grupo = await prisma.grupoConteudo.findFirst({ where: { edicaoId, nome: nomeGrupo } });
  if (!grupo) {
    grupo = await prisma.grupoConteudo.create({
      data: { edicaoId, nome: nomeGrupo, ordem: proximoIndiceGrupo },
    });
    console.log(`Grupo "${nomeGrupo}" criado (${grupo.id}).`);
  } else {
    console.log(`Grupo "${nomeGrupo}" já existia (${grupo.id}).`);
  }

  const lista = await prisma.listaConteudo.create({
    data: { grupoConteudoId: grupo.id, nome: nomeGrupo, ordem: 0 },
  });

  await prisma.itemConteudo.createMany({
    data: programas.map((programa, indice) => ({
      listaConteudoId: lista.id,
      nome: programa.nome,
      imagem: programa.imagem,
      link: programa.link,
      ordem: indice,
    })),
  });

  console.log(`  Lista "${nomeGrupo}" ok — ${programas.length} itens.`);
}

async function main() {
  const edicao = await prisma.edicao.findFirst({ orderBy: { numero: "desc" } });
  if (!edicao) {
    console.log("Nenhuma edição encontrada — nada a migrar.");
    return;
  }
  console.log(`Migrando pra edição ${edicao.numero} (${edicao.id})...`);

  const proximoIndiceGrupo = await migrarComissoes(edicao.id);
  await migrarProgramas(edicao.id, proximoIndiceGrupo);

  console.log("Migração concluída.");
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
