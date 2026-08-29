const { z } = require("zod");

const CORES_PUBLICAS = ["TINTA", "BARRO", "OCRE", "BUZIO", "AREIA", "PAPEL", "CERRADO"];
const CORES_HEX_REGEX = /^#[0-9a-fA-F]{6}$/;
// Além dos tokens da paleta curada, aceita um hex literal — cor
// personalizada escolhida livremente no seletor "Personalizada" do admin
// (ver CampoCorSecao.jsx no frontend).
const corPublicaSchema = z
  .union([z.enum(CORES_PUBLICAS), z.string().regex(CORES_HEX_REGEX)], {
    errorMap: () => ({ message: "Cor inválida" }),
  })
  .optional();
const tipoFaixaSchema = z.enum(["COR", "IMAGEM", "NENHUMA"], {
  errorMap: () => ({ message: "Tipo de faixa inválido" }),
}).optional();
const tipoFundoNavSchema = z.enum(["TRANSPARENTE", "COR"], {
  errorMap: () => ({ message: "Tipo de fundo inválido" }),
}).optional();
// Fundo de seção usa a mesma paleta de cor pública — nome mantido separado
// só por refletir o uso distinto (fundo x texto/ícone) dos campos que o
// consomem, hoje ambos String no schema Prisma (ver corFundoHero/CorSecao
// no comentário de schema.prisma).
const corSecaoSchema = corPublicaSchema;
const opacidadeSchema = z.coerce
  .number({ invalid_type_error: "Informe uma opacidade válida" })
  .int("Informe uma opacidade válida")
  .min(0, "A opacidade deve estar entre 0 e 100")
  .max(100, "A opacidade deve estar entre 0 e 100")
  .optional();

const edicaoRealizadorSchema = z
  .object({
    id: z.string().uuid().optional(),
    nome: z.string().trim().min(2, "Informe o nome do realizador"),
    imagem: z
      .string()
      .refine((valor) => valor.startsWith("data:image/"), "Imagem inválida")
      .optional(),
    link: z.string().trim().url("Link inválido").optional(),
  })
  .refine((dados) => dados.id || dados.imagem, {
    message: "Selecione uma imagem",
    path: ["imagem"],
  });

const edicaoApoiadorSchema = z
  .object({
    id: z.string().uuid().optional(),
    nome: z.string().trim().min(2, "Informe o nome do apoiador"),
    imagem: z
      .string()
      .refine((valor) => valor.startsWith("data:image/"), "Imagem inválida")
      .optional(),
    link: z.string().trim().url("Link inválido").optional(),
  })
  .refine((dados) => dados.id || dados.imagem, {
    message: "Selecione uma imagem",
    path: ["imagem"],
  });

const edicaoPontoInteresseSchema = z.object({
  id: z.string().uuid().optional(),
  tipo: z.enum(["LOCAL_EVENTO", "HOSPEDAGEM", "RESTAURANTE", "OUTRO"], {
    errorMap: () => ({ message: "Tipo de ponto inválido" }),
  }),
  nome: z.string().trim().min(2, "Informe o nome do ponto"),
  imagem: z
    .string()
    .refine((valor) => valor.startsWith("data:image/"), "Imagem inválida")
    .nullable()
    .optional(),
  endereco: z.string().trim().optional(),
  latitude: z.coerce
    .number({ invalid_type_error: "Informe uma latitude válida" })
    .min(-90, "Latitude inválida")
    .max(90, "Latitude inválida"),
  longitude: z.coerce
    .number({ invalid_type_error: "Informe uma longitude válida" })
    .min(-180, "Longitude inválida")
    .max(180, "Longitude inválida"),
  link: z.string().trim().url("Link inválido").optional(),
});

const edicaoSchema = z
  .object({
    numero: z.coerce
      .number({ invalid_type_error: "Informe um número de edição válido" })
      .int("Informe um número de edição válido")
      .positive("Informe um número de edição válido"),
    nome: z.string().trim().min(3, "Informe o nome da edição"),
    descricao: z
      .string()
      .trim()
      .max(2000, "A descrição deve ter no máximo 2000 caracteres")
      .optional(),
    dataInicio: z
      .coerce.date({
        errorMap: () => ({ message: "Informe uma data de início válida" }),
      })
      .optional(),
    dataFim: z
      .coerce.date({
        errorMap: () => ({ message: "Informe uma data de término válida" }),
      })
      .optional(),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífen")
      .optional(),
    cargaHorariaTotal: z.coerce
      .number({ invalid_type_error: "Informe uma carga horária válida" })
      .int("Informe uma carga horária válida")
      .positive("Informe uma carga horária válida")
      .optional(),
    instagram: z.string().trim().optional(),
    facebook: z.string().trim().optional(),
    emailContato: z.string().trim().email("E-mail inválido").optional().or(z.literal("")),
    linksExtras: z
      .array(
        z.object({
          rotulo: z.string().trim().min(1, "Informe um rótulo"),
          url: z.string().trim().url("URL inválida"),
        })
      )
      .optional(),
    modalidade: z.enum(["ONLINE", "PRESENCIAL", "HIBRIDO"], {
      errorMap: () => ({ message: "Modalidade inválida" }),
    }).optional(),
    local: z.string().trim().optional(),
    pais: z.string().trim().optional(),
    estado: z.string().trim().optional(),
    cidade: z.string().trim().optional(),
    fusoHorario: z.string().optional(),
    notificarAlteracoes: z.boolean().optional(),
    corFundoRealizadores: corSecaoSchema,
    opacidadeFundoRealizadores: opacidadeSchema,
    mostrarFaixaRealizadores: z.boolean().optional(),
    realizadores: z.array(edicaoRealizadorSchema).optional(),
    corFundoApoiadores: corSecaoSchema,
    opacidadeFundoApoiadores: opacidadeSchema,
    mostrarFaixaApoiadores: z.boolean().optional(),
    apoiadores: z.array(edicaoApoiadorSchema).optional(),
    pontosInteresse: z.array(edicaoPontoInteresseSchema).optional(),
    logoSvg: z.string().max(300_000, "Arquivo SVG muito grande").nullable().optional(),
    logoSvgCores: z
      .record(z.string(), z.string().regex(CORES_HEX_REGEX, "Cor inválida"))
      .nullable()
      .optional(),
    corFundoHero: corSecaoSchema,
    opacidadeFundoHero: z.coerce
      .number({ invalid_type_error: "Informe uma opacidade válida" })
      .int("Informe uma opacidade válida")
      .min(0, "A opacidade deve estar entre 0 e 100")
      .max(100, "A opacidade deve estar entre 0 e 100")
      .optional(),
    // Fundo em imagem — um arquivo por breakpoint (ver comentário no schema
    // Prisma). Limite maior que os outros campos de imagem porque o fundo é
    // full-bleed (até 2560px de largura recomendados), não um ícone/textura.
    fundoHeroTipo: tipoFaixaSchema,
    imagemFundoHeroDesktop: z.string().max(20_000_000, "Imagem muito grande").nullable().optional(),
    imagemFundoHeroMobile: z.string().max(20_000_000, "Imagem muito grande").nullable().optional(),
    corTextoHero: corPublicaSchema,
    corBuzioHero: corPublicaSchema,
    // Faixas laterais — configuráveis separadamente pra desktop e mobile
    // (ver SecaoHero.jsx no admin e page.module.scss, .heroFaixa).
    faixaHeroTipoDesktop: tipoFaixaSchema,
    corFaixaHeroDesktop: corPublicaSchema,
    imagemFaixaHeroDesktop: z.string().max(8_000_000, "Imagem muito grande").nullable().optional(),
    larguraFaixaHeroDesktop: z.coerce
      .number({ invalid_type_error: "Informe uma largura válida" })
      .int("Informe uma largura válida")
      .positive("Informe uma largura válida")
      .optional(),
    faixaHeroTipoMobile: tipoFaixaSchema,
    corFaixaHeroMobile: corPublicaSchema,
    imagemFaixaHeroMobile: z.string().max(8_000_000, "Imagem muito grande").nullable().optional(),
    larguraFaixaHeroMobile: z.coerce
      .number({ invalid_type_error: "Informe uma largura válida" })
      .int("Informe uma largura válida")
      .positive("Informe uma largura válida")
      .optional(),
    // Liga/desliga a faixa lateral só na Hero — mesmo mecanismo de
    // mostrarFaixaApresentacao/Modalidades/Agenda/Publicacoes abaixo.
    mostrarFaixaHero: z.boolean().optional(),
    // Cores da navbar — dois estados (Topo/Rolado, ver SecaoNavegacao.jsx no
    // admin e BarraNavegacao.jsx no público).
    fundoNavTopoTipo: tipoFundoNavSchema,
    corFundoNavTopo: corSecaoSchema,
    corTextoNavTopo: corPublicaSchema,
    corIconeNavTopo: corPublicaSchema,
    corBordaNavTopo: corPublicaSchema,
    corFundoNavRolado: corSecaoSchema,
    corTextoNavRolado: corPublicaSchema,
    corIconeNavRolado: corPublicaSchema,
    corBordaNavRolado: corPublicaSchema,
    navMesmoEstilo: z.boolean().optional(),
    corFundoBotaoNav: corSecaoSchema,
    corTextoBotaoNav: corPublicaSchema,
    // Demais dobras da página pública (ver SecaoAdmin no schema Prisma e
    // TextoSecaoForm.jsx/AgendaForm.jsx no admin) — sem limite de caracteres
    // em título/corpo, mesmo padrão adotado pra Atividade.descricao.
    tituloApresentacao: z.string().trim().optional(),
    corpoApresentacao: z.string().trim().optional(),
    corFundoApresentacao: corSecaoSchema,
    opacidadeFundoApresentacao: opacidadeSchema,
    corTextoApresentacao: corPublicaSchema,
    corBuzioApresentacao: corPublicaSchema,
    corFundoBotaoApresentacao: corPublicaSchema,
    corTextoBotaoApresentacao: corPublicaSchema,
    tituloModalidades: z.string().trim().optional(),
    corpoModalidades: z.string().trim().optional(),
    corFundoModalidades: corSecaoSchema,
    opacidadeFundoModalidades: opacidadeSchema,
    corTextoModalidades: corPublicaSchema,
    corBuzioModalidades: corPublicaSchema,
    corFundoCardModalidades: corSecaoSchema,
    opacidadeFundoCardModalidades: opacidadeSchema,
    corTextoCardModalidades: corPublicaSchema,
    corTextoSecundarioCardModalidades: corPublicaSchema,
    corAcentoCardModalidades: corPublicaSchema,
    corFundoBotaoCardModalidades: corPublicaSchema,
    corTextoBotaoCardModalidades: corPublicaSchema,
    corFundoAgenda: corSecaoSchema,
    opacidadeFundoAgenda: opacidadeSchema,
    corTextoAgenda: corPublicaSchema,
    corBuzioAgenda: corPublicaSchema,
    corFundoCardAgenda: corSecaoSchema,
    opacidadeFundoCardAgenda: opacidadeSchema,
    corTextoCardAgenda: corPublicaSchema,
    corTextoSecundarioCardAgenda: corPublicaSchema,
    corAcentoCardAgenda: corPublicaSchema,
    tituloPublicacoes: z.string().trim().optional(),
    corpoPublicacoes: z.string().trim().optional(),
    corFundoPublicacoes: corSecaoSchema,
    opacidadeFundoPublicacoes: opacidadeSchema,
    corTextoPublicacoes: corPublicaSchema,
    corBuzioPublicacoes: corPublicaSchema,
    corFundoLocalizacao: corSecaoSchema,
    opacidadeFundoLocalizacao: opacidadeSchema,
    corTextoLocalizacao: corPublicaSchema,
    // Liga/desliga a faixa lateral fixa (definida em faixaHero*) enquanto
    // cada seção está em tela — ver PaginaInicialConteudo.jsx.
    mostrarFaixaApresentacao: z.boolean().optional(),
    mostrarFaixaModalidades: z.boolean().optional(),
    mostrarFaixaAgenda: z.boolean().optional(),
    mostrarFaixaPublicacoes: z.boolean().optional(),
    mostrarFaixaLocalizacao: z.boolean().optional(),
    // Mensagem de contribuição voluntária na confirmação da inscrição
    // pública (ver ContribuicaoForm.jsx no admin e CardContribuicao.jsx no
    // público) — só aparece quando corpoContribuicao está preenchido. Link
    // usa .or(z.literal("")) porque o form sempre reenvia o estado local
    // inteiro a cada salvar(), então o campo pode chegar vazio quando a
    // ação escolhida é Nenhuma/Copiar.
    tituloContribuicao: z.string().trim().optional(),
    corpoContribuicao: z.string().trim().optional(),
    tipoAcaoContribuicao: z
      .enum(["NENHUMA", "LINK", "COPIAR"], {
        errorMap: () => ({ message: "Tipo de ação inválido" }),
      })
      .optional(),
    linkContribuicaoUrl: z.string().trim().url("Link inválido").optional().or(z.literal("")),
    linkContribuicaoRotulo: z.string().trim().optional(),
    copiaContribuicaoValor: z.string().trim().optional(),
    copiaContribuicaoRotulo: z.string().trim().optional(),
    qrCodeContribuicao: z.string().max(8_000_000, "Imagem muito grande").nullable().optional(),
  })
  .refine((dados) => !dados.dataInicio || !dados.dataFim || dados.dataFim > dados.dataInicio, {
    message: "A data de término deve ser posterior à data de início",
    path: ["dataFim"],
  })
  .refine((dados) => dados.tipoAcaoContribuicao !== "LINK" || Boolean(dados.linkContribuicaoUrl?.trim()), {
    message: "Informe a URL do link",
    path: ["linkContribuicaoUrl"],
  })
  .refine(
    (dados) => dados.tipoAcaoContribuicao !== "COPIAR" || Boolean(dados.copiaContribuicaoValor?.trim()),
    { message: "Informe o valor a ser copiado", path: ["copiaContribuicaoValor"] }
  );

module.exports = { edicaoSchema, edicaoRealizadorSchema, edicaoApoiadorSchema, edicaoPontoInteresseSchema };
