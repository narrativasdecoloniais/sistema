#!/usr/bin/env node
// Carrega o "Guia para hospedagem e alimentação" da V edição (2 a 5 de
// dezembro) na dobra Localização: cria os tipos Hospedagem e Alimentação se
// não existirem, acrescenta os pontos que ainda não estão na edição (compara
// pelo nome, sem diferenciar maiúsculas) e preenche os textos da dobra que
// estiverem vazios. Nunca apaga nem altera pontos já cadastrados.
//
// Sem --aplicar só mostra o que faria (o backend/.env aponta para produção).
//
// Uso:
//   node src/scripts/importarGuiaLocalizacao.js                 # prévia, edição mais recente
//   node src/scripts/importarGuiaLocalizacao.js --edicao 5      # prévia da edição número 5
//   node src/scripts/importarGuiaLocalizacao.js --edicao 5 --aplicar

require("../config/env");
const prisma = require("../config/prisma");

const TIPOS = {
  HOSPEDAGEM: { nome: "Hospedagem", cor: "#55603f", ordem: 2 },
  ALIMENTACAO: { nome: "Alimentação", cor: "#b87c34", ordem: 3 },
};
// Se já existir, só ganha ordem (quando não tiver) para vir antes dos demais.
const NOME_TIPO_LOCAL_EVENTO = "Local do evento";

const INTRODUCAO =
  "Guia de hospedagem e alimentação para os dias do evento, de 2 a 5 de dezembro. Use “Ver no mapa” para localizar cada lugar e “Como chegar” para traçar a rota no Google Maps.";

const TEXTOS = {
  HOSPEDAGEM: `Reunimos algumas opções de hospedagem na Asa Norte e na Vila Planalto, regiões com possibilidades de deslocamento até a Universidade de Brasília (UnB). A lista inclui hostels, pousadas e hotéis, buscando oferecer alternativas para diferentes orçamentos.

Os valores e a disponibilidade podem variar conforme o estabelecimento, o tipo de acomodação e o número de hóspedes. Por isso, recomendamos consultar os links disponibilizados para verificar as tarifas referentes ao período de 2 a 5 de dezembro de 2026.`,
  ALIMENTACAO:
    "A lista reúne sugestões dentro da UnB e na Asa Norte, de restaurantes, lanchonetes, cafés, bares e botecos, com diferentes estilos e faixas de preço. Recomendamos consultar os perfis dos estabelecimentos para verificar cardápios, valores, horários de funcionamento e formas de pagamento.",
};

const NO_CAMPUS = "No campus da UnB.";

// Coordenadas do documento original vêm como (longitude, latitude).
const PONTOS = [
  // ---- Hospedagem · Asa Norte ----
  { tipo: "HOSPEDAGEM", grupo: "Asa Norte", nome: "Hostel O Ogro", link: "https://www.oogro.com.br/hostel", lng: -47.89136, lat: -15.764294 },
  { tipo: "HOSPEDAGEM", grupo: "Asa Norte", nome: "Joy Hostel", link: "https://www.vemprojoy.com.br/hostel", lng: -47.890052, lat: -15.78083 },
  { tipo: "HOSPEDAGEM", grupo: "Asa Norte", nome: "Hostel Freeway", link: "https://hostelfreeway.com.br/", lng: -47.891472, lat: -15.764192 },
  { tipo: "HOSPEDAGEM", grupo: "Asa Norte", nome: "Pousada 714", link: "https://www.booking.com/hotel/br/pousada-714", lng: -47.897121, lat: -15.74634 },
  { tipo: "HOSPEDAGEM", grupo: "Asa Norte", nome: "Pousada 705 Norte", link: "https://www.booking.com/hotel/br/pousada-705-norte", lng: -47.888976, lat: -15.772439 },
  { tipo: "HOSPEDAGEM", grupo: "Asa Norte", nome: "Pousada Verdes Flores", link: "https://www.booking.com/hotel/br/pousada-verdes-flores-brasilia-brasilia2", lng: -47.8892, lat: -15.773101 },

  // ---- Hospedagem · Vila Planalto ----
  { tipo: "HOSPEDAGEM", grupo: "Vila Planalto", nome: "Hotel Brasília", link: "https://www.hotelbrasiliadf.com.br/61992406807", lng: -47.85224, lat: -15.79551 },
  { tipo: "HOSPEDAGEM", grupo: "Vila Planalto", nome: "Pousada Flor de Brasília", link: "https://www.instagram.com/pousadaflordebrasilia/", lng: -47.852198, lat: -15.793429 },
  { tipo: "HOSPEDAGEM", grupo: "Vila Planalto", nome: "Pousada Ipê da Vila", link: "https://pousadaipedavila.com.br/", lng: -47.85324, lat: -15.79561 },
  { tipo: "HOSPEDAGEM", grupo: "Vila Planalto", nome: "Hotel Vila 5 Brasília", link: "https://www.vila5brasilia.com.br/", lng: -47.850277, lat: -15.79268, aproximado: true },
  { tipo: "HOSPEDAGEM", grupo: "Vila Planalto", nome: "Pousada Vitória da Vila", link: "https://www.instagram.com/pousadavitoriadavila/", lng: -47.846785, lat: -15.792688 },
  { tipo: "HOSPEDAGEM", grupo: "Vila Planalto", nome: "Pousada Casa do Claus", link: "https://www.instagram.com/pousadacasadoclaus_/", lng: -47.855792, lat: -15.792406 },

  // ---- Alimentação · Restaurantes ----
  { tipo: "ALIMENTACAO", grupo: "Restaurantes", nome: "Restaurante Universitário (RU)", descricao: NO_CAMPUS, link: "https://ru.unb.br/", lng: -47.870433, lat: -15.764219 },
  { tipo: "ALIMENTACAO", grupo: "Restaurantes", nome: "Restaurante Espaço Chico Mendes", descricao: NO_CAMPUS, link: "https://www.instagram.com/espacochicomendes/", lng: -47.870136, lat: -15.766623 },
  { tipo: "ALIMENTACAO", grupo: "Restaurantes", nome: "Balaio Café", descricao: NO_CAMPUS, link: "https://www.instagram.com/balaiocafe/", lng: -47.872562, lat: -15.767105 },
  { tipo: "ALIMENTACAO", grupo: "Restaurantes", nome: "Gulla's", descricao: NO_CAMPUS, link: "https://www.instagram.com/lanchesgullas/", lng: -47.866813, lat: -15.766043 },
  { tipo: "ALIMENTACAO", grupo: "Restaurantes", nome: "Utopia Café e Bistrô", descricao: "No campus da UnB. Comida vegana.", link: "https://www.instagram.com/utopiacafebistro/", lng: -47.86055, lat: -15.76326 },
  { tipo: "ALIMENTACAO", grupo: "Restaurantes", nome: "Restaurante Ki Sabor", link: "https://www.instagram.com/kisaborbrasilia/", lng: -47.877103, lat: -15.765951 },
  { tipo: "ALIMENTACAO", grupo: "Restaurantes", nome: "Supren Verda", descricao: "Comida vegana, sem glúten e sem lactose.", link: "https://www.instagram.com/supren_verda/", lng: -47.877953, lat: -15.777236 },
  { tipo: "ALIMENTACAO", grupo: "Restaurantes", nome: "Taioba Restaurante", endereco: "CLN 111", link: "https://www.instagram.com/taiobarestaurante/", lng: -47.890616, lat: -15.75289, aproximado: true },
  { tipo: "ALIMENTACAO", grupo: "Restaurantes", nome: "Restaurante Esquina Mineira", link: "https://www.instagram.com/souesquinamineira/", lng: -47.890524, lat: -15.775339 },
  { tipo: "ALIMENTACAO", grupo: "Restaurantes", nome: "Restaurante Cantinho Brasileiro", link: "https://www.instagram.com/cantinhobrasileiro307/", lng: -47.887271, lat: -15.768312 },

  // ---- Alimentação · Lanchonetes, cafés e lanches rápidos ----
  { tipo: "ALIMENTACAO", grupo: "Lanchonetes, cafés e lanches rápidos", nome: "Café das Letras", descricao: NO_CAMPUS, link: "https://www.instagram.com/cafedasletrasunb/", lng: -47.870191, lat: -15.764919 },
  { tipo: "ALIMENTACAO", grupo: "Lanchonetes, cafés e lanches rápidos", nome: "Amarelinho — MASC Norte", descricao: "Lanchonete no Módulo de Apoio e Serviços Comunitários (MASC) Norte, no campus da UnB.", link: "https://maps.app.goo.gl/JgrypL3E8csPH1Qc9", lng: -47.871112, lat: -15.75799 },
  { tipo: "ALIMENTACAO", grupo: "Lanchonetes, cafés e lanches rápidos", nome: "Amarelinho — MASC Sul", descricao: "Lanchonete no Módulo de Apoio e Serviços Comunitários (MASC) Sul, no campus da UnB.", link: "https://maps.app.goo.gl/vPsh1cGYXKPzxRYZA", lng: -47.865693, lat: -15.767856, aproximado: true },
  { tipo: "ALIMENTACAO", grupo: "Lanchonetes, cafés e lanches rápidos", nome: "Los Baristas", link: "https://www.instagram.com/losbaristas/", lng: -47.876547, lat: -15.773612 },
  { tipo: "ALIMENTACAO", grupo: "Lanchonetes, cafés e lanches rápidos", nome: "Marilda Café", link: "https://www.instagram.com/marilda_cafe/", lng: -47.899253, lat: -15.740619 },
  { tipo: "ALIMENTACAO", grupo: "Lanchonetes, cafés e lanches rápidos", nome: "Café e Um Chêro Asa Norte", link: "https://www.instagram.com/cafeeumchero/", lng: -47.887724, lat: -15.759176 },

  // ---- Alimentação · Bares e botecos ----
  { tipo: "ALIMENTACAO", grupo: "Bares e botecos", nome: "Bar Pardim", endereco: "405 Norte", link: "https://www.instagram.com/barpardim/", lng: -47.877284, lat: -15.773149, aproximado: true },
  { tipo: "ALIMENTACAO", grupo: "Bares e botecos", nome: "Mimo Bar", link: "https://www.instagram.com/mimobarbsb/", lng: -47.878872, lat: -15.776814 },
  { tipo: "ALIMENTACAO", grupo: "Bares e botecos", nome: "Patinho Feio Bar", link: "https://www.instagram.com/patinhofeiobar/", lng: -47.882394, lat: -15.780659 },
  { tipo: "ALIMENTACAO", grupo: "Bares e botecos", nome: "Bar dos Amigos 410", link: "https://www.instagram.com/bardosamigos410/", lng: -47.882194, lat: -15.754029 },
  { tipo: "ALIMENTACAO", grupo: "Bares e botecos", nome: "Bar Pôr do Sol", link: "https://www.instagram.com/pds408norte/", lng: -47.879689, lat: -15.760029 },
  { tipo: "ALIMENTACAO", grupo: "Bares e botecos", nome: "Bar do Mendes", link: "https://www.instagram.com/bardomendes/", lng: -47.881287, lat: -15.753841 },
  { tipo: "ALIMENTACAO", grupo: "Bares e botecos", nome: "Sabiá Boteco", link: "https://www.instagram.com/sabiaboteco/", lng: -47.882404, lat: -15.757428 },
  { tipo: "ALIMENTACAO", grupo: "Bares e botecos", nome: "Bar Fausto e Manoel", link: "https://www.instagram.com/faustoemanoeloficial/", lng: -47.883615, lat: -15.757799, aproximado: true },
  { tipo: "ALIMENTACAO", grupo: "Bares e botecos", nome: "Abençoado Bar", link: "https://www.instagram.com/abencoadonorte/", lng: -47.881537, lat: -15.764036 },
  { tipo: "ALIMENTACAO", grupo: "Bares e botecos", nome: "Bar Beirute", link: "https://www.instagram.com/beirutebar/", lng: -47.886204, lat: -15.765379, aproximado: true },
];

function lerArgumentos() {
  const args = process.argv.slice(2);
  const indiceEdicao = args.indexOf("--edicao");
  return {
    numeroEdicao: indiceEdicao >= 0 ? Number(args[indiceEdicao + 1]) : null,
    aplicar: args.includes("--aplicar"),
  };
}

async function buscarTipoPorNome(nome) {
  return prisma.tipoPontoInteresse.findFirst({ where: { nome: { equals: nome, mode: "insensitive" } } });
}

async function main() {
  const { numeroEdicao, aplicar } = lerArgumentos();

  const edicao = numeroEdicao
    ? await prisma.edicao.findFirst({ where: { numero: numeroEdicao } })
    : await prisma.edicao.findFirst({ orderBy: { numero: "desc" } });
  if (!edicao) throw new Error("Edição não encontrada.");

  console.log(`Edição: ${edicao.numero} — ${edicao.nome}`);
  console.log(aplicar ? "Modo: APLICAR (gravando no banco)\n" : "Modo: prévia (nada é gravado; use --aplicar)\n");

  // ---- tipos ----
  const idsTipos = {};
  for (const [chave, tipo] of Object.entries(TIPOS)) {
    const existente = await buscarTipoPorNome(tipo.nome);
    if (existente) {
      idsTipos[chave] = existente.id;
      if (existente.ordem === null) {
        console.log(`  tipo "${existente.nome}": já existe, recebe ordem ${tipo.ordem}`);
        if (aplicar) await prisma.tipoPontoInteresse.update({ where: { id: existente.id }, data: { ordem: tipo.ordem } });
      } else {
        console.log(`  tipo "${existente.nome}": já existe`);
      }
    } else {
      console.log(`  tipo "${tipo.nome}": será criado (cor ${tipo.cor}, ordem ${tipo.ordem})`);
      idsTipos[chave] = aplicar ? (await prisma.tipoPontoInteresse.create({ data: tipo })).id : `(novo ${tipo.nome})`;
    }
  }

  const localEvento = await buscarTipoPorNome(NOME_TIPO_LOCAL_EVENTO);
  if (localEvento && localEvento.ordem === null) {
    console.log(`  tipo "${localEvento.nome}": recebe ordem 1`);
    if (aplicar) await prisma.tipoPontoInteresse.update({ where: { id: localEvento.id }, data: { ordem: 1 } });
  }

  // ---- pontos ----
  const existentes = await prisma.edicaoPontoInteresse.findMany({
    where: { edicaoId: edicao.id },
    select: { nome: true, ordem: true },
  });
  const nomesExistentes = new Set(existentes.map((ponto) => ponto.nome.trim().toLowerCase()));
  let proximaOrdem = existentes.reduce((maior, ponto) => Math.max(maior, ponto.ordem + 1), 0);

  console.log("");
  let criados = 0;
  for (const ponto of PONTOS) {
    if (nomesExistentes.has(ponto.nome.toLowerCase())) {
      console.log(`  = ${ponto.nome} (já cadastrado, mantido)`);
      continue;
    }
    console.log(`  + ${TIPOS[ponto.tipo].nome} › ${ponto.grupo} › ${ponto.nome}${ponto.aproximado ? " (aproximado)" : ""}`);
    criados += 1;
    if (aplicar) {
      await prisma.edicaoPontoInteresse.create({
        data: {
          edicaoId: edicao.id,
          tipoId: idsTipos[ponto.tipo],
          nome: ponto.nome,
          grupo: ponto.grupo,
          descricao: ponto.descricao || null,
          endereco: ponto.endereco || null,
          latitude: ponto.lat,
          longitude: ponto.lng,
          aproximado: Boolean(ponto.aproximado),
          link: ponto.link,
          ordem: proximaOrdem,
        },
      });
    }
    proximaOrdem += 1;
  }

  // ---- textos da dobra (só os vazios) ----
  const dadosEdicao = {};
  if (!edicao.introducaoLocalizacao) dadosEdicao.introducaoLocalizacao = INTRODUCAO;

  const textosAtuais = edicao.textosTiposLocalizacao || {};
  const textos = { ...textosAtuais };
  for (const [chave, texto] of Object.entries(TEXTOS)) {
    const id = idsTipos[chave];
    if (!textos[id]) textos[id] = texto;
  }
  if (Object.keys(textos).length !== Object.keys(textosAtuais).length) {
    dadosEdicao.textosTiposLocalizacao = textos;
  }

  console.log("");
  console.log(`  texto de abertura: ${dadosEdicao.introducaoLocalizacao ? "será preenchido" : "já preenchido, mantido"}`);
  console.log(`  textos das categorias: ${dadosEdicao.textosTiposLocalizacao ? "serão preenchidos os que faltam" : "já preenchidos, mantidos"}`);
  if (aplicar && Object.keys(dadosEdicao).length > 0) {
    await prisma.edicao.update({ where: { id: edicao.id }, data: dadosEdicao });
  }

  console.log(`\n${criados} ponto(s) ${aplicar ? "criado(s)" : "a criar"}.`);
}

main()
  .catch((erro) => {
    console.error("Erro ao importar o guia de localização:", erro);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
