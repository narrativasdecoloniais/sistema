const crypto = require("crypto");
const prisma = require("../config/prisma");
const ErroHttp = require("../utils/erroHttp");
const { gerarHash } = require("../utils/senha");
const storageService = require("./storage.service");

const CAMPOS_PUBLICOS = {
  id: true,
  nome: true,
  email: true,
  cpf: true,
  instituicao: true,
  categoria: true,
  foto: true,
  emailConfirmado: true,
  papeis: true,
  acessoCompleto: true,
  secoesPermitidas: true,
  createdAt: true,
};

// Usuario.foto guarda só o path do objeto no bucket privado do GCS — nunca a
// URL assinada, que expira em 1h e é gerada de novo a cada leitura.
async function anexarUrlFoto(usuario) {
  if (!usuario) return usuario;
  return { ...usuario, foto: await storageService.gerarUrlAssinada(usuario.foto) };
}

async function buscarPorCpf(cpf) {
  return prisma.usuario.findUnique({ where: { cpf } });
}

function normalizarEmail(email) {
  return String(email).trim().toLowerCase();
}

// Compara sem diferenciar maiúsculas: o e-mail não era normalizado no cadastro
// (o da importação do Even3 veio como digitado, ex. "Ana@x.com"), então quem
// digitava "ana@x.com" não achava a conta — nem recebia o e-mail de recuperação
// de senha — e acabava com uma conta duplicada. O índice único do banco ainda
// diferencia caixa, então podem existir duas contas que só diferem nisso; nesse
// caso vale a de grafia idêntica, depois a que já tem CPF (é a que a pessoa usa
// pra entrar) e por fim a mais antiga.
async function buscarPorEmail(email) {
  const alvo = String(email).trim();
  const candidatos = await prisma.usuario.findMany({
    where: { email: { equals: alvo, mode: "insensitive" } },
    orderBy: { createdAt: "asc" },
  });
  return (
    candidatos.find((usuario) => usuario.email === alvo) ||
    candidatos.find((usuario) => usuario.cpf) ||
    candidatos[0] ||
    null
  );
}

// Conta que ainda pode receber um CPF: ativa e sem CPF (importada do Even3 ou
// criada por submissão). mode: "insensitive" porque o e-mail não é
// normalizado no cadastro e o da importação veio como digitado no Even3
// (ex. "Ana@x.com") — a mesma pessoa digita "ana@x.com" e não bateria.
async function buscarContaSemCpfPorEmail(email) {
  return prisma.usuario.findFirst({
    where: { email: { equals: email, mode: "insensitive" }, cpf: null, ativo: true },
  });
}

// Nome de uma conta a partir do e-mail, sem vazar mais dados que isso — usado
// pra autofill ao adicionar um coautor de submissão (público e área do
// participante). Retorna null tanto se não existe conta quanto se está
// inativa, propositalmente (mesmo tratamento nos dois casos).
async function buscarNomePublicoPorEmail(email) {
  const usuario = await buscarPorEmail(email);
  return usuario?.ativo ? usuario.nome : null;
}

async function buscarPorId(id) {
  const usuario = await prisma.usuario.findUnique({ where: { id }, select: CAMPOS_PUBLICOS });
  return anexarUrlFoto(usuario);
}

// Usado pelo admin para localizar um usuário já cadastrado (via cadastro
// público ou inscrição) ao adicionar uma inscrição manualmente — nunca cria
// conta nova por aqui.
async function buscarPorTermo(termo) {
  return prisma.usuario.findMany({
    where: {
      ativo: true,
      OR: [
        { nome: { contains: termo, mode: "insensitive" } },
        { email: { contains: termo, mode: "insensitive" } },
        { cpf: { contains: termo, mode: "insensitive" } },
      ],
    },
    select: { id: true, nome: true, email: true, cpf: true, instituicao: true, categoria: true },
    take: 10,
    orderBy: { nome: "asc" },
  });
}

async function buscarCompletoPorId(id) {
  return prisma.usuario.findUnique({ where: { id } });
}

// Autor/coautor de submissão sem conta é guardado só como nome/e-mail soltos
// (SubmissaoAutor.usuarioId null) — se essa pessoa se cadastrar depois, por
// qualquer um dos fluxos de criação de conta, associamos retroativamente
// pelo e-mail. Chamada ao final de toda função criarUsuario* abaixo.
async function associarAutoriasPendentes(usuarioId, email) {
  // mode: "insensitive" porque e-mail não é normalizado no cadastro — sem
  // isso, um coautor guardado como "Ana@x.com" não associaria com a conta
  // criada depois como "ana@x.com".
  await prisma.submissaoAutor.updateMany({
    where: { usuarioId: null, email: { equals: email, mode: "insensitive" } },
    data: { usuarioId },
  });
}

async function criarUsuario(dados) {
  const senhaHash = await gerarHash(dados.senha);
  const agora = new Date();

  const usuario = await prisma.usuario.create({
    data: {
      nome: dados.nome,
      email: normalizarEmail(dados.email),
      cpf: dados.cpf,
      instituicao: dados.instituicao,
      categoria: dados.categoria,
      senhaHash,
      aceiteTermosEm: agora,
      aceitePrivacidadeEm: agora,
    },
  });
  await associarAutoriasPendentes(usuario.id, usuario.email);
  return usuario;
}

// Cria uma conta sem senha, CPF, categoria ou instituição — usada quando um
// admin convida alguém para organizar antes dessa pessoa ter se cadastrado por
// conta própria. Senha e CPF reais só são definidos quando o convite é aceito
// (ver definirSenhaEAceites), então o hash abaixo nunca é utilizável para login.
async function criarUsuarioConvidado({ nome, email, acessoCompleto, secoesPermitidas }) {
  const senhaHash = await gerarHash(crypto.randomBytes(32).toString("hex"));

  return prisma.usuario.create({
    data: {
      nome,
      email: normalizarEmail(email),
      senhaHash,
      papeis: ["ORGANIZADOR"],
      acessoCompleto,
      secoesPermitidas,
    },
  });
}

// Cria uma conta sem senha utilizável, usada pelo fluxo público de
// auto-inscrição em eventos: a pessoa preenche os dados de cadastro sem
// definir senha (nem confirmar e-mail) e só define uma senha real depois,
// via "esqueci minha senha", se quiser fazer login.
async function criarUsuarioViaInscricao({ nome, email, cpf, instituicao, categoria }) {
  const senhaHash = await gerarHash(crypto.randomBytes(32).toString("hex"));
  const agora = new Date();

  const usuario = await prisma.usuario.create({
    data: {
      nome,
      email: normalizarEmail(email),
      cpf,
      instituicao,
      categoria,
      senhaHash,
      aceiteTermosEm: agora,
      aceitePrivacidadeEm: agora,
    },
  });
  await associarAutoriasPendentes(usuario.id, usuario.email);
  return usuario;
}

// Mesmo padrão de criarUsuarioViaInscricao, mas sem CPF — o fluxo público de
// submissão de trabalho identifica só por e-mail (ver submissoes.service.js).
// emailConfirmado começa false; o próprio clique no link mágico de entrada
// confirma o e-mail (ver controller de submissão pública).
async function criarUsuarioViaSubmissao({ nome, email, instituicao, categoria }) {
  const senhaHash = await gerarHash(crypto.randomBytes(32).toString("hex"));
  const agora = new Date();

  const usuario = await prisma.usuario.create({
    data: {
      nome,
      email: normalizarEmail(email),
      instituicao,
      categoria,
      senhaHash,
      aceiteTermosEm: agora,
      aceitePrivacidadeEm: agora,
    },
  });
  await associarAutoriasPendentes(usuario.id, usuario.email);
  return usuario;
}

// Conta já existia (criada via submissão de trabalho ou convite de
// organizador, sem CPF) e a pessoa está se inscrevendo agora com um CPF
// novo — completa o cadastro nessa mesma conta em vez de tentar criar uma
// segunda com o mesmo e-mail (que violaria o @unique).
// confirmarEmail: só quando a posse do e-mail já foi provada (código enviado
// pra caixa de entrada da conta) — o vínculo direto por e-mail digitado
// (cadastrar em inscricoes.controller.js) não prova nada e não confirma.
async function vincularCpfAoUsuario(id, cpf, { confirmarEmail = false } = {}) {
  const agora = new Date();
  return prisma.usuario.update({
    where: { id },
    data: {
      cpf,
      aceiteTermosEm: agora,
      aceitePrivacidadeEm: agora,
      ...(confirmarEmail ? { emailConfirmado: true } : {}),
    },
  });
}

async function definirSenhaEAceites(id, { senha, cpf, aceiteTermosEm, aceitePrivacidadeEm }) {
  const senhaHash = await gerarHash(senha);

  return prisma.usuario.update({
    where: { id },
    data: {
      senhaHash,
      cpf,
      emailConfirmado: true,
      aceiteTermosEm,
      aceitePrivacidadeEm,
    },
  });
}

async function atualizarPerfil(id, dados) {
  const camposParaSalvar = { ...dados };

  if ("foto" in dados) {
    const usuarioAtual = await buscarCompletoPorId(id);
    if (dados.foto && dados.foto.startsWith("data:image/")) {
      camposParaSalvar.foto = await storageService.salvarImagemPrivada(dados.foto, "usuarios");
    }
    if (usuarioAtual?.foto) {
      await storageService.removerImagemPrivada(usuarioAtual.foto);
    }
  }

  const usuario = await prisma.usuario.update({
    where: { id },
    data: camposParaSalvar,
    select: CAMPOS_PUBLICOS,
  });
  return anexarUrlFoto(usuario);
}

// Também confirma o e-mail: quem chega aqui pelo "esqueci minha senha" clicou
// num link enviado pra própria caixa de entrada, o que já prova posse do
// e-mail — evita um segundo passo de confirmação separado pra contas criadas
// sem senha (inscrição, submissão). Quem troca a senha já logado também passa
// por aqui; nesse caso o e-mail já estava confirmado (login exige isso).
async function atualizarSenha(id, novaSenha) {
  const senhaHash = await gerarHash(novaSenha);
  await prisma.usuario.update({ where: { id }, data: { senhaHash, emailConfirmado: true } });
}

async function confirmarEmail(id) {
  await prisma.usuario.update({ where: { id }, data: { emailConfirmado: true } });
}

// Alteração feita pelo gestor (admin ou organizador com a seção Participantes
// liberada) sobre a conta de outra pessoa — diferente de atualizarPerfil, que
// é o próprio usuário editando os próprios dados e nunca aceita e-mail. Já
// marca emailConfirmado: true porque é o gestor digitando o endereço correto,
// não a pessoa provando posse dele por link — não precisa de um novo fluxo de
// confirmação.
async function atualizarEmail(id, novoEmail) {
  const usuario = await buscarCompletoPorId(id);
  if (!usuario) throw new ErroHttp(404, "Usuário não encontrado.");

  const emailExistente = await buscarPorEmail(novoEmail);
  if (emailExistente && emailExistente.id !== id) {
    throw new ErroHttp(409, "Já existe um cadastro com esse e-mail.");
  }

  return prisma.usuario.update({
    where: { id },
    data: { email: normalizarEmail(novoEmail), emailConfirmado: true },
    select: CAMPOS_PUBLICOS,
  });
}

// Operações (ainda não executadas) que anonimizam a conta — separadas pra
// unificarUsuarios poder rodá-las dentro da sua própria transação.
function operacoesAnonimizacao(id, cliente = prisma) {
  return [
    cliente.usuario.update({
      where: { id },
      data: {
        nome: "Usuário removido",
        email: `anon-${id}@anonimizado.local`,
        cpf: `anon-${id}`,
        instituicao: "",
        papeis: [],
        acessoCompleto: false,
        secoesPermitidas: [],
        ativo: false,
        anonimizadoEm: new Date(),
      },
    }),
    cliente.refreshToken.updateMany({
      where: { usuarioId: id, revogadoEm: null },
      data: { revogadoEm: new Date() },
    }),
  ];
}

async function anonimizarUsuario(id) {
  await prisma.$transaction(operacoesAnonimizacao(id));
}

module.exports = {
  CAMPOS_PUBLICOS,
  buscarPorCpf,
  buscarPorEmail,
  buscarContaSemCpfPorEmail,
  buscarNomePublicoPorEmail,
  buscarPorId,
  buscarPorTermo,
  buscarCompletoPorId,
  criarUsuario,
  criarUsuarioConvidado,
  criarUsuarioViaInscricao,
  criarUsuarioViaSubmissao,
  vincularCpfAoUsuario,
  definirSenhaEAceites,
  atualizarPerfil,
  atualizarSenha,
  confirmarEmail,
  atualizarEmail,
  anonimizarUsuario,
  operacoesAnonimizacao,
};
