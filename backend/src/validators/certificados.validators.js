const { z } = require("zod");

// Espelhado em frontend/lib/validacao.js (modeloCertificadoSchema) — mudou um,
// muda o outro.

const TIPOS_CERTIFICADO = ["PARTICIPACAO_EVENTO", "PRESENCA_ATIVIDADE", "APRESENTACAO_TRABALHO", "AVALIADOR", "MONITOR"];

// Página A4 paisagem, em mm. Sobra mínima pra caixa de texto não sumir.
const LARGURA_PAGINA_MM = 297;
const ALTURA_PAGINA_MM = 210;
const SOBRA_MINIMA_MM = 20;

const tipoCertificadoSchema = z.enum(TIPOS_CERTIFICADO, {
  errorMap: () => ({ message: "Tipo de certificado inválido" }),
});

const numero = (min, max, rotulo) =>
  z
    .number({ invalid_type_error: `Informe ${rotulo}`, required_error: `Informe ${rotulo}` })
    .min(min, `${rotulo[0].toUpperCase()}${rotulo.slice(1)} deve ser no mínimo ${min}`)
    .max(max, `${rotulo[0].toUpperCase()}${rotulo.slice(1)} deve ser no máximo ${max}`);

// imagemFundo: undefined = mantém; null = remove; data URI PNG/JPEG = nova
// imagem; URL = reaproveita o fundo de outro tipo ("Copiar layout").
const imagemFundoSchema = z
  .string()
  .max(25_000_000, "A imagem de fundo é grande demais")
  .refine(
    (valor) => /^data:image\/(png|jpeg);base64,/.test(valor) || /^https:\/\//.test(valor),
    "Envie a imagem de fundo em PNG ou JPG"
  )
  .nullable()
  .optional();

const modeloCertificadoSchema = z
  .object({
    imagemFundo: imagemFundoSchema,
    texto: z.string({ required_error: "Escreva o texto do certificado" }).max(50_000, "O texto está grande demais"),
    margemSuperior: numero(0, 180, "a margem superior"),
    margemInferior: numero(0, 180, "a margem inferior"),
    margemEsquerda: numero(0, 260, "a margem esquerda"),
    margemDireita: numero(0, 260, "a margem direita"),
    alinhamento: z.enum(["ESQUERDA", "CENTRO", "DIREITA", "JUSTIFICADO"]),
    alinhamentoVertical: z.enum(["TOPO", "CENTRO"]),
    fonte: z.enum(["ARCHIVO", "TIMES", "HELVETICA"]),
    tamanhoFonte: numero(6, 72, "o tamanho da fonte"),
    entrelinha: numero(1, 3, "o espaçamento entre linhas"),
    corTexto: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Escolha uma cor válida"),
    posicaoQr: z.enum(["INFERIOR_DIREITO", "INFERIOR_ESQUERDO", "SUPERIOR_DIREITO", "SUPERIOR_ESQUERDO"]),
    tamanhoQr: numero(15, 60, "o tamanho do QR code"),
    margemQr: numero(0, 60, "a distância do QR code até a borda"),
    cargaHoraria: z
      .number({ invalid_type_error: "Carga horária inválida" })
      .int("A carga horária deve ser um número inteiro")
      .min(1, "A carga horária deve ser de pelo menos 1 hora")
      .max(2000, "Carga horária grande demais")
      .nullable()
      .optional(),
  })
  .refine((d) => d.margemSuperior + d.margemInferior <= ALTURA_PAGINA_MM - SOBRA_MINIMA_MM, {
    message: "As margens superior e inferior somadas deixam pouco espaço para o texto",
    path: ["margemInferior"],
  })
  .refine((d) => d.margemEsquerda + d.margemDireita <= LARGURA_PAGINA_MM - SOBRA_MINIMA_MM, {
    message: "As margens esquerda e direita somadas deixam pouco espaço para o texto",
    path: ["margemDireita"],
  });

const liberacaoSchema = z.object({ liberado: z.boolean() });

const inclusaoManualSchema = z.object({
  tipo: tipoCertificadoSchema.refine((tipo) => tipo !== "APRESENTACAO_TRABALHO", {
    message: "Certificados de apresentação de trabalho saem só pela regra (trabalho aprovado e vinculado a uma atividade)",
  }),
  usuarioId: z.string({ required_error: "Escolha a pessoa" }).uuid("Escolha a pessoa"),
  atividadeId: z.string().uuid("Escolha a atividade").nullable().optional(),
});

const motivoSchema = z.string().trim().max(500, "O motivo pode ter no máximo 500 caracteres").optional();

const revogacaoSchema = z.object({ motivo: motivoSchema });

const revogacaoEmLoteSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, "Selecione ao menos um certificado").max(5000),
  motivo: motivoSchema,
});

module.exports = {
  TIPOS_CERTIFICADO,
  tipoCertificadoSchema,
  modeloCertificadoSchema,
  liberacaoSchema,
  inclusaoManualSchema,
  revogacaoSchema,
  revogacaoEmLoteSchema,
};
