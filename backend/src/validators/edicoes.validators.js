const { z } = require("zod");

const CORES_PUBLICAS = ["TINTA", "BARRO", "OCRE", "BUZIO", "AREIA", "PAPEL", "CERRADO"];
const corPublicaSchema = z.enum(CORES_PUBLICAS, { errorMap: () => ({ message: "Cor inválida" }) }).optional();
const tipoFaixaSchema = z.enum(["COR", "IMAGEM", "NENHUMA"], {
  errorMap: () => ({ message: "Tipo de faixa inválido" }),
}).optional();
const tipoFundoNavSchema = z.enum(["TRANSPARENTE", "COR"], {
  errorMap: () => ({ message: "Tipo de fundo inválido" }),
}).optional();
// Fundo de seção usa a mesma paleta de cor pública (CorSecao e CorPublica
// têm os mesmos valores no schema Prisma, mantidos como enums separados por
// representarem usos distintos — fundo x texto/ícone).
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
    logoSvg: z.string().max(300_000, "Arquivo SVG muito grande").nullable().optional(),
    logoSvgCores: z
      .record(z.string(), z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida"))
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
    // Liga/desliga a faixa lateral fixa (definida em faixaHero*) enquanto
    // cada seção está em tela — ver PaginaInicialConteudo.jsx.
    mostrarFaixaApresentacao: z.boolean().optional(),
    mostrarFaixaModalidades: z.boolean().optional(),
    mostrarFaixaAgenda: z.boolean().optional(),
    mostrarFaixaPublicacoes: z.boolean().optional(),
  })
  .refine((dados) => !dados.dataInicio || !dados.dataFim || dados.dataFim > dados.dataInicio, {
    message: "A data de término deve ser posterior à data de início",
    path: ["dataFim"],
  });

module.exports = { edicaoSchema, edicaoRealizadorSchema, edicaoApoiadorSchema };
