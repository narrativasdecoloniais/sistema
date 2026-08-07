const { z } = require("zod");

const CORES_PUBLICAS = ["TINTA", "BARRO", "OCRE", "BUZIO", "AREIA", "PAPEL", "CERRADO"];
const corPublicaSchema = z.enum(CORES_PUBLICAS, { errorMap: () => ({ message: "Cor inválida" }) }).optional();
const tipoFaixaSchema = z.enum(["COR", "IMAGEM", "NENHUMA"], {
  errorMap: () => ({ message: "Tipo de faixa inválido" }),
}).optional();

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
    corFundoRealizadores: z.enum(["PAPEL", "TINTA", "BARRO", "OCRE", "CERRADO"], {
      errorMap: () => ({ message: "Cor inválida" }),
    }).optional(),
    realizadores: z.array(edicaoRealizadorSchema).optional(),
    logoSvg: z.string().max(300_000, "Arquivo SVG muito grande").nullable().optional(),
    logoSvgCores: z
      .record(z.string(), z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida"))
      .nullable()
      .optional(),
    corFundoHero: z.enum(["PAPEL", "TINTA", "BARRO", "OCRE", "CERRADO"], {
      errorMap: () => ({ message: "Cor inválida" }),
    }).optional(),
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
    faixaHeroTipoMobile: tipoFaixaSchema,
    corFaixaHeroMobile: corPublicaSchema,
    imagemFaixaHeroMobile: z.string().max(8_000_000, "Imagem muito grande").nullable().optional(),
  })
  .refine((dados) => !dados.dataInicio || !dados.dataFim || dados.dataFim > dados.dataInicio, {
    message: "A data de término deve ser posterior à data de início",
    path: ["dataFim"],
  });

module.exports = { edicaoSchema, edicaoRealizadorSchema };
