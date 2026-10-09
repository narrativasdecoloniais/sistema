const crypto = require("crypto");
const prisma = require("../config/prisma");
const ErroHttp = require("../utils/erroHttp");
const { gerarHash } = require("../utils/senha");
const storageService = require("./storage.service");
const { temIdentificacao } = require("../utils/identificacao");

const CAMPOS_PUBLICOS = {
  id: true,
  nome: true,
  email: true,
  cpf: true,
  documentoEstrangeiro: true,
  pais: true,
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

// documento já normalizado (ver utils/identificacao.js).
async function buscarPorDocumento(documentoEstrangeiro) {
  return prisma.usuario.findUnique({ where: { documentoEstrangeiro } });
}

// identificacao: { cpf } ou { documentoEstrangeiro, pais } (identificacaoDe).
async function buscarPorIdentificacao(identificacao) {
  return identificacao.cpf
    ? buscarPorCpf(identificacao.cpf)
    : buscarPorDocumento(identificacao.documentoEstrangeiro);
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
    candidatos.find((usuario) => temIdentificacao(usuario)) ||
    candidatos[0] ||
    null
  );
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
        { documentoEstrangeiro: { contains: termo, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      nome: true,
      email: true,
      cpf: true,
      documentoEstrangeiro: true,
      pais: true,
      instituicao: true,
      categoria: true,
    },
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
  await prisma.$transaction([
    prisma.submissaoAutor.updateMany({
      where: { usuarioId: null, email: { equals: email, mode: "insensitive" } },
      data: { usuarioId },
    }),
    ...operacoesVinculosCertificado(usuarioId, email),
  ]);
}

// Convidados de atividade (AtividadePessoa) e membros da equipe do evento
// (MembroEquipe) seguem a mesma regra das autorias: os soltos com esse e-mail
// passam a ser da conta e, numa troca de e-mail da conta (emailDaConta), os já
// ligados acompanham o novo endereço — é para ele que o certificado vai.
function operacoesVinculosCertificado(usuarioId, email, { emailDaConta = false } = {}) {
  const alvo = normalizarEmail(email);
  return [prisma.atividadePessoa, prisma.membroEquipe].flatMap((modelo) => [
    ...(emailDaConta ? [modelo.updateMany({ where: { usuarioId }, data: { email: alvo } })] : []),
    modelo.updateMany({
      where: { usuarioId: null, email: { equals: alvo, mode: "insensitive" } },
      data: { usuarioId },
    }),
  ]);
}

// dados.identificacao: { cpf } ou { documentoEstrangeiro, pais }.
async function criarUsuario(dados) {
  const senhaHash = await gerarHash(dados.senha);
  const agora = new Date();

  const usuario = await prisma.usuario.create({
    data: {
      nome: dados.nome,
      email: normalizarEmail(dados.email),
      ...dados.identificacao,
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
// admin convida alguém para organizar (ou avaliar submissões) antes dessa
// pessoa ter se cadastrado por conta própria. Senha e CPF reais só são
// definidos quando o convite é aceito (ver definirSenhaEAceites), então o hash
// abaixo nunca é utilizável para login.
async function criarUsuarioConvidado({
  nome,
  email,
  papeis = ["ORGANIZADOR"],
  acessoCompleto = false,
  secoesPermitidas = [],
}) {
  const senhaHash = await gerarHash(crypto.randomBytes(32).toString("hex"));

  return prisma.usuario.create({
    data: {
      nome,
      email: normalizarEmail(email),
      senhaHash,
      papeis,
      acessoCompleto,
      secoesPermitidas,
    },
  });
}

// Conta sem senha utilizável e sem CPF — o fluxo público de
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

// Conta já existia (criada via submissão de trabalho, importada do Even3 ou
// convite, sem CPF) e a pessoa vincula agora um CPF (ou documento de
// estrangeiro) — completa o cadastro nessa mesma conta em vez de criar uma
// segunda com o mesmo e-mail (que violaria o @unique).
// confirmarEmail: só quando a posse do e-mail já foi provada (código enviado
// pra caixa de entrada da conta, ver regularizacaoContas.service.js).
async function vincularIdentificacaoAoUsuario(id, identificacao, { confirmarEmail = false } = {}) {
  const agora = new Date();
  return prisma.usuario.update({
    where: { id },
    data: {
      ...identificacao,
      aceiteTermosEm: agora,
      aceitePrivacidadeEm: agora,
      ...(confirmarEmail ? { emailConfirmado: true } : {}),
    },
  });
}

async function definirSenhaEAceites(id, { senha, identificacao, aceiteTermosEm, aceitePrivacidadeEm }) {
  const senhaHash = await gerarHash(senha);

  return prisma.usuario.update({
    where: { id },
    data: {
      senhaHash,
      ...identificacao,
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

  // Autorias seguem o novo e-mail e autorias soltas com ele são ligadas,
  // como em trocarProprioEmail.
  const email = normalizarEmail(novoEmail);
  const [atualizado] = await prisma.$transaction([
    prisma.usuario.update({
      where: { id },
      data: { email, emailConfirmado: true },
      select: CAMPOS_PUBLICOS,
    }),
    prisma.submissaoAutor.updateMany({ where: { usuarioId: id }, data: { email } }),
    prisma.submissaoAutor.updateMany({
      where: { usuarioId: null, email: { equals: email, mode: "insensitive" } },
      data: { usuarioId: id },
    }),
    ...operacoesVinculosCertificado(id, email, { emailDaConta: true }),
  ]);
  return atualizado;
}

// Troca feita pelo próprio usuário, depois de digitar o código enviado para o
// novo endereço (posse provada, então já fica confirmado). As autorias
// ligadas à conta passam a usar o novo e-mail — é para ele que saem os
// e-mails de resultado —, e autorias soltas com o novo e-mail são associadas.
async function trocarProprioEmail(id, novoEmail) {
  const email = normalizarEmail(novoEmail);
  const emailExistente = await buscarPorEmail(email);
  if (emailExistente && emailExistente.id !== id) {
    throw new ErroHttp(409, "Já existe um cadastro com esse e-mail.");
  }

  const [usuario] = await prisma.$transaction([
    prisma.usuario.update({
      where: { id },
      data: { email, emailConfirmado: true },
      select: CAMPOS_PUBLICOS,
    }),
    prisma.submissaoAutor.updateMany({ where: { usuarioId: id }, data: { email } }),
    prisma.submissaoAutor.updateMany({
      where: { usuarioId: null, email: { equals: email, mode: "insensitive" } },
      data: { usuarioId: id },
    }),
    ...operacoesVinculosCertificado(id, email, { emailDaConta: true }),
  ]);
  return anexarUrlFoto(usuario);
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
        documentoEstrangeiro: null,
        pais: null,
        tokenCracha: null,
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
    // Certificados da conta: revogados e sem nome/documento no snapshot (a
    // validação pública passa a mostrar só "revogado"). Na unificação, os que
    // não eram duplicados já foram movidos pra conta mantida antes daqui.
    cliente.certificado.updateMany({
      where: {
        OR: [
          { usuarioId: id },
          { submissaoAutor: { usuarioId: id } },
          { atividadePessoa: { usuarioId: id } },
          { membroEquipe: { usuarioId: id } },
        ],
      },
      data: {
        dados: { nome: "Usuário removido" },
        revogadoEm: new Date(),
        motivoRevogacao: "Conta removida",
      },
    }),
    // Histórico de e-mails em massa guarda cópia de nome/e-mail.
    cliente.envioEmailDestinatario.updateMany({
      where: { usuarioId: id },
      data: { nome: "Usuário removido", email: `anon-${id}@anonimizado.local` },
    }),
  ];
}

// Conta com autoria em submissão não pode ser excluída: a anonimização não
// solta SubmissaoAutor/Submissao.usuarioId, então o trabalho ficaria preso à
// conta anonimizada e um cadastro novo com o mesmo e-mail não o recuperaria
// (associarAutoriasPendentes só pega autorias sem conta).
async function anonimizarUsuario(id) {
  const autorias = await prisma.submissaoAutor.count({ where: { usuarioId: id } });
  if (autorias > 0) {
    throw new ErroHttp(
      409,
      "Sua conta está vinculada a trabalhos submetidos como autor(a) ou coautor(a) e não pode ser excluída. Para usar outro e-mail, altere-o nesta página; para outras situações, fale com a organização do evento."
    );
  }
  await prisma.$transaction(operacoesAnonimizacao(id));
}

module.exports = {
  CAMPOS_PUBLICOS,
  buscarPorCpf,
  buscarPorDocumento,
  buscarPorIdentificacao,
  buscarPorEmail,
  buscarNomePublicoPorEmail,
  buscarPorId,
  buscarPorTermo,
  buscarCompletoPorId,
  criarUsuario,
  criarUsuarioConvidado,
  criarUsuarioViaSubmissao,
  associarAutoriasPendentes,
  operacoesVinculosCertificado,
  vincularIdentificacaoAoUsuario,
  definirSenhaEAceites,
  atualizarPerfil,
  atualizarSenha,
  confirmarEmail,
  atualizarEmail,
  trocarProprioEmail,
  normalizarEmail,
  anonimizarUsuario,
  operacoesAnonimizacao,
};
