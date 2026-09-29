const prisma = require("../config/prisma");
const ErroHttp = require("../utils/erroHttp");
const { mascararEmailParcial } = require("../utils/mascararEmail");
const { identificacaoDe, temIdentificacao, rotuloIdentificacao } = require("../utils/identificacao");
const usuariosService = require("./usuarios.service");
const tokenService = require("./token.service");
const emailService = require("./email.service");
const { previaUnificacao, unificarUsuarios } = require("./unificacaoUsuarios.service");

// Regularização pública de cadastro — TEMPORÁRIA, só para a edição V.
// A importação do Even3 criou contas sem CPF (com as submissões) e muita
// gente criou outra conta pela inscrição, com outro e-mail. Aqui a própria
// pessoa acha as contas pelo nome, prova posse pelo e-mail da conta sem CPF
// (o único verificado: Even3 ou link mágico da submissão — o da inscrição
// não é validado) e vincula o CPF ou unifica. Exceção consciente às regras de
// não vazar contas: a busca é pública (e-mail sempre mascarado pela metade).
// "CPF" aqui vale também para o documento de estrangeiro (sem CPF).
// Remover (este arquivo, controller, routes, validators e a página) quando não
// houver mais contas importadas sem CPF.

const PALAVRAS_IGNORADAS = new Set(["de", "da", "do", "das", "dos", "e"]);
const MAX_RESULTADOS = 10;
const MAX_TITULOS = 5;

function palavrasDoNome(nome) {
  return String(nome)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((palavra) => palavra.length >= 2 && !PALAVRAS_IGNORADAS.has(palavra));
}

function distancia(a, b) {
  const linha = Array.from({ length: b.length + 1 }, (_, indice) => indice);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = linha[0];
    linha[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const acima = linha[j];
      linha[j] = Math.min(linha[j] + 1, linha[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = acima;
    }
  }
  return linha[b.length];
}

// Igual, prefixo (abreviação/nome cortado) ou um erro de digitação.
function palavrasCasam(buscada, doNome) {
  if (buscada === doNome) return true;
  if (buscada.length >= 4 && doNome.length >= 4 && (doNome.startsWith(buscada) || buscada.startsWith(doNome))) {
    return true;
  }
  return buscada.length >= 5 && doNome.length >= 5 && distancia(buscada, doNome) <= 1;
}

function pontuar(palavrasBuscadas, nome) {
  const palavrasNome = palavrasDoNome(nome);
  const casadas = palavrasBuscadas.filter((buscada) => palavrasNome.some((doNome) => palavrasCasam(buscada, doNome)));
  return { casadas: casadas.length, fracao: casadas.length / palavrasBuscadas.length };
}

// Mesmo critério de bloqueio da unificação: admin/organizador/avaliador ficam
// de fora (e contas anonimizadas não aparecem).
const WHERE_ELEGIVEL = { ativo: true, anonimizadoEm: null, papeis: { equals: ["PARTICIPANTE"] } };

async function buscarContasPorNome(nome) {
  const palavrasBuscadas = palavrasDoNome(nome);
  if (palavrasBuscadas.length < 2) {
    throw new ErroHttp(400, "Digite pelo menos nome e sobrenome.");
  }

  // Sem unaccent/pg_trgm no banco — pontua em memória (só id+nome).
  const candidatas = await prisma.usuario.findMany({ where: WHERE_ELEGIVEL, select: { id: true, nome: true } });
  const encontradas = candidatas
    .map((conta) => ({ id: conta.id, ...pontuar(palavrasBuscadas, conta.nome) }))
    .filter((conta) => conta.casadas >= 2 && conta.fracao >= 0.6)
    .sort((a, b) => b.fracao - a.fracao || b.casadas - a.casadas)
    .slice(0, MAX_RESULTADOS);
  if (encontradas.length === 0) return [];

  const ids = encontradas.map((conta) => conta.id);
  const [contas, enviadas, autorias] = await Promise.all([
    prisma.usuario.findMany({
      where: { id: { in: ids } },
      select: { id: true, nome: true, email: true, cpf: true, documentoEstrangeiro: true },
    }),
    prisma.submissao.findMany({ where: { usuarioId: { in: ids } }, select: { usuarioId: true, titulo: true } }),
    prisma.submissaoAutor.findMany({
      where: { usuarioId: { in: ids } },
      select: { usuarioId: true, submissao: { select: { titulo: true } } },
    }),
  ]);

  const titulosPorConta = new Map(ids.map((id) => [id, new Set()]));
  enviadas.forEach((submissao) => titulosPorConta.get(submissao.usuarioId)?.add(submissao.titulo));
  autorias.forEach((autoria) => titulosPorConta.get(autoria.usuarioId)?.add(autoria.submissao.titulo));

  const porId = new Map(contas.map((conta) => [conta.id, conta]));
  return ids
    .map((id) => porId.get(id))
    .filter(Boolean)
    .map((conta) => ({
      id: conta.id,
      nome: conta.nome,
      email: mascararEmailParcial(conta.email),
      temIdentificacao: temIdentificacao(conta),
      titulos: [...titulosPorConta.get(conta.id)].slice(0, MAX_TITULOS),
    }));
}

async function carregarContas(contaIds) {
  const contas = await prisma.usuario.findMany({
    where: { id: { in: contaIds }, ...WHERE_ELEGIVEL },
    select: { id: true, nome: true, email: true, cpf: true, documentoEstrangeiro: true },
  });
  if (contas.length !== contaIds.length) {
    throw new ErroHttp(404, "Alguma das contas selecionadas não foi encontrada. Faça a busca de novo.");
  }
  return contaIds.map((id) => contas.find((conta) => conta.id === id));
}

async function garantirIdentificacaoLivre(identificacao) {
  if (await usuariosService.buscarPorIdentificacao(identificacao)) {
    throw new ErroHttp(
      409,
      `Esse ${rotuloIdentificacao(identificacao)} já está em outra conta. Busque e selecione também essa conta para unificar.`
    );
  }
}

function mesmaIdentificacao(conta, identificacao) {
  return identificacao.cpf
    ? conta.cpf === identificacao.cpf
    : conta.documentoEstrangeiro === identificacao.documentoEstrangeiro;
}

// Decide o que fazer com a seleção. Só as contas sem CPF recebem código: o
// e-mail delas é o verificado. A conta com CPF (criada pela inscrição, e-mail
// possivelmente errado) é provada pelo CPF digitado, que tem de ser o dela.
async function montarPlano(dados) {
  const { contaIds, manterId } = dados;
  const identificacao = identificacaoDe(dados);
  const contas = await carregarContas(contaIds);

  if (contas.length === 1) {
    const [conta] = contas;
    if (temIdentificacao(conta)) {
      throw new ErroHttp(409, 'Esta conta já tem CPF ou documento. Entre com ele ou use "Esqueci minha senha".');
    }
    await garantirIdentificacaoLivre(identificacao);
    return { tipo: "VINCULAR", identificacao, manter: conta, remover: null, contasComCodigo: [conta], bloqueios: [], avisos: [] };
  }

  const comCpf = contas.filter((conta) => temIdentificacao(conta));
  const semCpf = contas.filter((conta) => !temIdentificacao(conta));
  let manter;
  let remover;

  if (comCpf.length === 2) {
    throw new ErroHttp(409, "As duas contas já têm CPF ou documento. Fale com a organização do evento para unificá-las.");
  }
  if (comCpf.length === 1) {
    if (!mesmaIdentificacao(comCpf[0], identificacao)) {
      throw new ErroHttp(400, `O ${rotuloIdentificacao(identificacao)} informado não é o da conta com CPF/documento selecionada.`);
    }
    // Fica a conta do Even3: o e-mail dela é o verificado; o CPF vem da outra.
    [manter] = semCpf;
    [remover] = comCpf;
  } else {
    manter = contas.find((conta) => conta.id === manterId);
    if (!manter) throw new ErroHttp(400, "Escolha qual e-mail vai continuar valendo.");
    remover = contas.find((conta) => conta.id !== manterId);
    await garantirIdentificacaoLivre(identificacao);
  }

  const previa = await previaUnificacao(manter.id, remover.id);
  return {
    tipo: "UNIFICAR",
    identificacao,
    manter,
    remover,
    contasComCodigo: semCpf,
    bloqueios: previa.bloqueios,
    // O e-mail da conta que fica é confirmado pelo código — o aviso não se aplica.
    avisos: previa.avisos.filter((aviso) => !aviso.includes("não está confirmado")),
  };
}

function resumirPlano(plano) {
  return {
    tipo: plano.tipo,
    emailFinal: mascararEmailParcial(plano.manter.email),
    contasComCodigo: plano.contasComCodigo.map((conta) => ({ id: conta.id, email: mascararEmailParcial(conta.email) })),
    bloqueios: plano.bloqueios,
    avisos: plano.avisos,
  };
}

function garantirSemBloqueios(plano) {
  if (plano.bloqueios.length > 0) throw new ErroHttp(409, plano.bloqueios[0]);
}

async function previa(dados) {
  return resumirPlano(await montarPlano(dados));
}

async function enviarCodigos(dados) {
  const plano = await montarPlano(dados);
  garantirSemBloqueios(plano);

  for (const conta of plano.contasComCodigo) {
    const codigo = await tokenService.criarCodigoVinculoConta(conta.id);
    await emailService.enviarEmailCodigoRegularizacao(conta, codigo);
  }
  return resumirPlano(plano);
}

async function confirmar({ codigos, ...dados }) {
  const plano = await montarPlano(dados);
  garantirSemBloqueios(plano);

  // Confere todos antes de consumir: errar um não pode queimar o outro.
  for (const conta of plano.contasComCodigo) {
    if (!(await tokenService.codigoVinculoContaValido(conta.id, codigos[conta.id]))) {
      throw new ErroHttp(
        400,
        `Código inválido ou expirado para ${mascararEmailParcial(conta.email)}. Peça um novo código.`
      );
    }
  }
  for (const conta of plano.contasComCodigo) {
    await tokenService.consumirCodigoVinculoConta(conta.id, codigos[conta.id]);
  }

  if (plano.tipo === "VINCULAR") {
    await usuariosService.vincularIdentificacaoAoUsuario(plano.manter.id, plano.identificacao, { confirmarEmail: true });
  } else {
    const { usuario } = await unificarUsuarios({
      manterId: plano.manter.id,
      removerId: plano.remover.id,
      confirmarEmail: true,
    });
    if (!temIdentificacao(usuario)) {
      await usuariosService.vincularIdentificacaoAoUsuario(plano.manter.id, plano.identificacao, {
        confirmarEmail: true,
      });
    }
  }

  console.log(
    `[regularizacao] ${plano.tipo} pela página pública: conta ${plano.manter.id}` +
      (plano.remover ? ` recebeu a conta ${plano.remover.id}` : "")
  );
  return { tipo: plano.tipo, email: mascararEmailParcial(plano.manter.email) };
}

module.exports = { buscarContasPorNome, previa, enviarCodigos, confirmar };
