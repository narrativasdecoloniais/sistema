"use client";

import { useMemo, useRef, useState } from "react";
import { Copy, Eye, Save } from "lucide-react";
import Botao from "@/components/forms/Botao";
import CampoRichText from "@/components/forms/CampoRichText";
import CampoLogo from "./CampoLogo";
import CampoIntervalo from "./CampoIntervalo";
import CampoNumero from "./CampoNumero";
import CampoSelecao from "./CampoSelecao";
import PreviaCertificado from "./PreviaCertificado";
import { useToast } from "./ToastProvider";
import { salvarBlob } from "@/lib/apiClient";
import { modeloCertificadoSchema } from "@/lib/validacao";
import {
  TIPOS_LIBERADOS_COM_RESULTADO,
  avisosFundo,
  certificadosAdmin,
  limitesPosicaoQr,
  paginaCertificado,
} from "@/lib/certificados";
import stylesCampo from "./CampoPrime.module.scss";
import estilosResultado from "./ResultadoSubmissoesPainel.module.scss";
import styles from "./CertificadosPainel.module.scss";

const TAMANHO_MAX_FUNDO = 20 * 1024 * 1024;

// Campos do formulário = campos editáveis de ModeloCertificado.
export const CAMPOS_MODELO = [
  "imagemFundo",
  "texto",
  "margemSuperior",
  "margemInferior",
  "margemEsquerda",
  "margemDireita",
  "alinhamento",
  "alinhamentoVertical",
  "fonte",
  "tamanhoFonte",
  "entrelinha",
  "corTexto",
  "esquerdaQr",
  "topoQr",
  "tamanhoQr",
  "alinhamentoCodigoQr",
  "corQr",
  "cargaHoraria",
];

// "Copiar layout" leva o fundo e a posição/tipografia/QR — o texto e a carga
// horária são de cada tipo.
const CAMPOS_LAYOUT = CAMPOS_MODELO.filter((campo) => !["texto", "cargaHoraria"].includes(campo));

export function formDoModelo(modelo) {
  return Object.fromEntries(CAMPOS_MODELO.map((campo) => [campo, modelo[campo] ?? null]));
}

const OPCOES_ALINHAMENTO = [
  { valor: "ESQUERDA", rotulo: "À esquerda" },
  { valor: "CENTRO", rotulo: "Centralizado" },
  { valor: "DIREITA", rotulo: "À direita" },
  { valor: "JUSTIFICADO", rotulo: "Justificado" },
];

const OPCOES_VERTICAL = [
  { valor: "CENTRO", rotulo: "Centralizado na área" },
  { valor: "TOPO", rotulo: "Encostado no topo da área" },
];

const OPCOES_FONTE = [
  { valor: "ARCHIVO", rotulo: "Archivo (fonte do site)" },
  { valor: "TIMES", rotulo: "Times (serifada)" },
  { valor: "HELVETICA", rotulo: "Helvetica" },
];

const OPCOES_CODIGO_QR = [
  { valor: "ESQUERDA", rotulo: "À esquerda do QR" },
  { valor: "CENTRO", rotulo: "Centralizado no QR" },
  { valor: "DIREITA", rotulo: "À direita do QR" },
];

const AJUDA_CARGA = {
  PARTICIPACAO_EVENTO: "Deixe vazio para usar a carga horária total da edição (Configurações › Evento).",
  PRESENCA_ATIVIDADE: "Deixe vazio para usar a carga horária de cada atividade.",
  APRESENTACAO_TRABALHO: "Deixe vazio para usar a carga horária da atividade em que o trabalho foi apresentado.",
  AVALIADOR: "Se ficar vazio, o campo {{cargaHoraria}} sai em branco.",
  MONITOR: "Se ficar vazio, o campo {{cargaHoraria}} sai em branco.",
  ATUACAO_ATIVIDADE: "Deixe vazio para usar a carga horária de cada atividade.",
  EQUIPE_EVENTO: "Deixe vazio para usar a carga horária informada em cada membro da equipe.",
};

// A carta de aceite não tem carga horária.
const TIPOS_SEM_CARGA = ["CARTA_ACEITE"];

function marcadoresDesconhecidos(texto, marcadores) {
  const validos = new Set(marcadores.map((m) => m.chave));
  const usados = [...String(texto || "").matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((m) => m[1]);
  return [...new Set(usados.filter((chave) => !validos.has(chave)))];
}

function Secao({ titulo, descricao, children }) {
  return (
    <section className={styles.secao}>
      <div>
        <h3 className={styles.tituloSecao}>{titulo}</h3>
        {descricao && <p className={styles.descricaoSecao}>{descricao}</p>}
      </div>
      {children}
    </section>
  );
}

export default function ModeloCertificadoForm({
  edicaoId,
  tipo,
  form,
  alterarForm,
  modeloSalvo,
  alterado,
  marcadores,
  exemplo,
  outrosTipos = [],
  aoSalvar,
  // Rotas do modelo — por padrão as de Certificados; a carta de aceite usa as
  // da tela Submissões › Carta de aceite (CartasAceitePainel.jsx).
  api = certificadosAdmin,
}) {
  const { notificar } = useToast();
  const editorRef = useRef(null);
  const pagina = paginaCertificado(tipo);
  const orientacao = pagina.retrato ? "retrato" : "paisagem";
  const documento = tipo === "CARTA_ACEITE" ? "carta" : "certificado";
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [gerandoPrevia, setGerandoPrevia] = useState(false);
  const [dimensoes, setDimensoes] = useState(null);
  const [origemCopia, setOrigemCopia] = useState("");

  const valoresPrevia = useMemo(
    () => ({ ...exemplo, cargaHoraria: form.cargaHoraria != null ? String(form.cargaHoraria) : exemplo.cargaHoraria }),
    [exemplo, form.cargaHoraria]
  );
  const desconhecidos = marcadoresDesconhecidos(form.texto, marcadores);
  const avisos = form.imagemFundo ? avisosFundo(dimensoes, pagina) : [];
  const limitesQr = limitesPosicaoQr(pagina, form.tamanhoQr);

  function alterar(campo, valor) {
    alterarForm({ ...form, [campo]: valor });
    if (erros[campo]) setErros((atual) => ({ ...atual, [campo]: undefined }));
  }

  // Aumentar o QR perto da borda direita/inferior puxa a posição pra dentro,
  // pra ele continuar inteiro na página.
  function alterarTamanhoQr(valor) {
    const limites = limitesPosicaoQr(pagina, valor);
    alterarForm({
      ...form,
      tamanhoQr: valor,
      esquerdaQr: Math.min(form.esquerdaQr, limites.esquerda),
      topoQr: Math.min(form.topoQr, limites.topo),
    });
    setErros((atual) => ({ ...atual, tamanhoQr: undefined, esquerdaQr: undefined, topoQr: undefined }));
  }

  function alterarFundo(valor) {
    setDimensoes(null);
    alterar("imagemFundo", valor);
  }

  function validar() {
    const resultado = modeloCertificadoSchema(pagina).safeParse(form);
    if (resultado.success) {
      setErros({});
      return true;
    }
    const novos = {};
    for (const problema of resultado.error.issues) {
      const campo = problema.path[0];
      if (campo && !novos[campo]) novos[campo] = problema.message;
    }
    setErros(novos);
    notificar(resultado.error.issues[0].message, "erro");
    return false;
  }

  async function salvar() {
    if (!validar()) return;
    setSalvando(true);
    try {
      const resposta = await api.salvarModelo(edicaoId, tipo, form);
      notificar(resposta.mensagem);
      aoSalvar(resposta.modelo);
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setSalvando(false);
    }
  }

  // Abre a aba antes da requisição — depois do await o navegador bloquearia o
  // pop-up. Sem aba (bloqueada), baixa o arquivo.
  async function previsualizarPdf() {
    if (!validar()) return;
    const janela = window.open("", "_blank");
    setGerandoPrevia(true);
    try {
      const blob = await api.previa(edicaoId, tipo, form);
      if (janela) janela.location.href = URL.createObjectURL(blob);
      else salvarBlob(blob, `previa-${documento}.pdf`);
    } catch (erro) {
      janela?.close();
      notificar(erro.message, "erro");
    } finally {
      setGerandoPrevia(false);
    }
  }

  function copiarLayout() {
    const origem = outrosTipos.find((outro) => outro.tipo === origemCopia);
    if (!origem) return;
    const copia = Object.fromEntries(CAMPOS_LAYOUT.map((campo) => [campo, origem.form[campo]]));
    setDimensoes(null);
    alterarForm({ ...form, ...copia });
    notificar(`Layout de "${origem.rotulo}" copiado. Salve para aplicar.`);
  }

  return (
    <div className={styles.gradeModelo}>
      <div className={styles.controles}>
        <Secao
          titulo="Imagem de fundo"
          descricao={
            tipo === "CARTA_ACEITE"
              ? "O papel timbrado da carta (cabeçalho, logos, assinaturas). O texto e o QR code são desenhados por cima."
              : "A arte do certificado (bordas, logos, assinaturas). O texto e o QR code são desenhados por cima."
          }
        >
          <CampoLogo
            id={`fundo-${tipo}`}
            rotulo="Arquivo"
            valor={form.imagemFundo}
            onChange={alterarFundo}
            dimensaoMax={Math.max(pagina.fundoRecomendado.largura, pagina.fundoRecomendado.altura)}
            tamanhoMaxArquivo={TAMANHO_MAX_FUNDO}
            textoItem="imagem"
            forcarJpeg
          />
          <div className={styles.orientacaoFundo}>
            <p>
              <strong>
                Tamanho recomendado: {pagina.fundoRecomendado.largura} × {pagina.fundoRecomendado.altura} px
              </strong>{" "}
              — A4 {orientacao} ({pagina.largura} × {pagina.altura} mm) a 300 dpi, qualidade de impressão.
            </p>
            <p>
              Mínimo: {pagina.fundoMinimo.largura} × {pagina.fundoMinimo.altura} px (150 dpi). PNG ou JPG, até 20 MB.
              Mantenha a proporção do A4 {orientacao} e deixe livre a área onde vão o texto e o QR code.
            </p>
          </div>
          {form.imagemFundo && dimensoes && (
            <p className={styles.textoApoio}>
              Imagem enviada: {dimensoes.largura} × {dimensoes.altura} px
              {avisos.length === 0 ? " — tamanho adequado." : "."}
            </p>
          )}
          {avisos.map((aviso) => (
            <p key={aviso} className={styles.aviso} role="status">
              {aviso}
            </p>
          ))}
        </Secao>

        <Secao
          titulo="Texto"
          descricao={`Clique num campo dinâmico para inseri-lo onde está o cursor. Cada campo é trocado pelo dado ${
            tipo === "CARTA_ACEITE" ? "do trabalho na carta" : "da pessoa no certificado"
          }.`}
        >
          <CampoRichText
            ref={editorRef}
            id={`texto-${tipo}`}
            rotulo={`Texto ${tipo === "CARTA_ACEITE" ? "da carta" : "do certificado"}`}
            value={form.texto}
            onChange={(valor) => alterar("texto", valor)}
            ferramentas={["negrito", "italico"]}
            erro={erros.texto}
            alto
          />
          <div>
            <h4 className={styles.rotuloLista}>Campos dinâmicos</h4>
            <ul className={estilosResultado.marcadores}>
              {marcadores.map((marcador) => (
                <li key={marcador.chave}>
                  <button
                    type="button"
                    className={estilosResultado.marcador}
                    onClick={() => editorRef.current?.inserirTexto(`{{${marcador.chave}}}`)}
                    title={`Inserir {{${marcador.chave}}}`}
                  >
                    <code>{`{{${marcador.chave}}}`}</code>
                    <span>{marcador.descricao}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          {desconhecidos.length > 0 && (
            <p className={styles.aviso} role="alert">
              {desconhecidos.map((chave) => `{{${chave}}}`).join(", ")}{" "}
              {desconhecidos.length === 1 ? "não é um campo válido" : "não são campos válidos"} para{" "}
              {tipo === "CARTA_ACEITE" ? "a carta de aceite" : "este tipo de certificado"} — corrija antes de salvar.
            </p>
          )}
        </Secao>

        <Secao
          titulo="Área do texto"
          descricao={`Distância de cada borda da página até o texto, em milímetros (a página tem ${pagina.largura} × ${pagina.altura} mm). A área aparece tracejada na prévia.`}
        >
          <div className={styles.gradeCampos}>
            <CampoIntervalo
              id={`margem-superior-${tipo}`}
              rotulo="Superior"
              valor={form.margemSuperior}
              onChange={(valor) => alterar("margemSuperior", valor)}
              min={0}
              max={pagina.altura - 30}
              unidade=" mm"
              erro={erros.margemSuperior}
            />
            <CampoIntervalo
              id={`margem-inferior-${tipo}`}
              rotulo="Inferior"
              valor={form.margemInferior}
              onChange={(valor) => alterar("margemInferior", valor)}
              min={0}
              max={pagina.altura - 30}
              unidade=" mm"
              erro={erros.margemInferior}
            />
            <CampoIntervalo
              id={`margem-esquerda-${tipo}`}
              rotulo="Esquerda"
              valor={form.margemEsquerda}
              onChange={(valor) => alterar("margemEsquerda", valor)}
              min={0}
              max={pagina.largura - 37}
              unidade=" mm"
              erro={erros.margemEsquerda}
            />
            <CampoIntervalo
              id={`margem-direita-${tipo}`}
              rotulo="Direita"
              valor={form.margemDireita}
              onChange={(valor) => alterar("margemDireita", valor)}
              min={0}
              max={pagina.largura - 37}
              unidade=" mm"
              erro={erros.margemDireita}
            />
            <CampoSelecao
              id={`alinhamento-${tipo}`}
              rotulo="Alinhamento do texto"
              value={form.alinhamento}
              onChange={(evento) => alterar("alinhamento", evento.target.value)}
            >
              {OPCOES_ALINHAMENTO.map((opcao) => (
                <option key={opcao.valor} value={opcao.valor}>
                  {opcao.rotulo}
                </option>
              ))}
            </CampoSelecao>
            <CampoSelecao
              id={`vertical-${tipo}`}
              rotulo="Posição vertical"
              value={form.alinhamentoVertical}
              onChange={(evento) => alterar("alinhamentoVertical", evento.target.value)}
            >
              {OPCOES_VERTICAL.map((opcao) => (
                <option key={opcao.valor} value={opcao.valor}>
                  {opcao.rotulo}
                </option>
              ))}
            </CampoSelecao>
          </div>
        </Secao>

        <Secao
          titulo="Tipografia"
          descricao="Se o texto de alguém não couber na área, o PDF reduz a fonte automaticamente."
        >
          <div className={styles.gradeCampos}>
            <CampoSelecao
              id={`fonte-${tipo}`}
              rotulo="Fonte"
              value={form.fonte}
              onChange={(evento) => alterar("fonte", evento.target.value)}
            >
              {OPCOES_FONTE.map((opcao) => (
                <option key={opcao.valor} value={opcao.valor}>
                  {opcao.rotulo}
                </option>
              ))}
            </CampoSelecao>
            <div className={stylesCampo.grupo}>
              <label htmlFor={`cor-${tipo}`} className={stylesCampo.rotulo}>
                Cor do texto
              </label>
              <div className={styles.linhaCor}>
                <input
                  id={`cor-${tipo}`}
                  type="color"
                  className={styles.seletorCor}
                  value={form.corTexto}
                  onChange={(evento) => alterar("corTexto", evento.target.value.toUpperCase())}
                />
                <code className={styles.valorCor}>{form.corTexto}</code>
              </div>
            </div>
            <CampoIntervalo
              id={`tamanho-${tipo}`}
              rotulo="Tamanho"
              valor={form.tamanhoFonte}
              onChange={(valor) => alterar("tamanhoFonte", valor)}
              min={8}
              max={40}
              passo={0.5}
              unidade=" pt"
              erro={erros.tamanhoFonte}
            />
            <CampoIntervalo
              id={`entrelinha-${tipo}`}
              rotulo="Espaço entre linhas"
              valor={form.entrelinha}
              onChange={(valor) => alterar("entrelinha", valor)}
              min={1}
              max={2.5}
              passo={0.05}
              unidade="×"
              erro={erros.entrelinha}
            />
          </div>
        </Secao>

        <Secao
          titulo="QR code de validação"
          descricao={`Leva à página pública que confirma a autenticidade. Posição do canto superior esquerdo do QR, em milímetros a partir das bordas (a página tem ${pagina.largura} × ${pagina.altura} mm); o código de validação sai escrito embaixo, na mesma cor. O QR não tem fundo próprio: escolha uma cor que contraste bem com a imagem de fundo nesse ponto, senão a leitura pela câmera pode falhar.`}
        >
          <div className={styles.gradeCampos}>
            <CampoIntervalo
              id={`esquerda-qr-${tipo}`}
              rotulo="Distância da esquerda"
              valor={form.esquerdaQr}
              onChange={(valor) => alterar("esquerdaQr", valor)}
              min={0}
              max={limitesQr.esquerda}
              passo={0.5}
              unidade=" mm"
              erro={erros.esquerdaQr}
            />
            <CampoIntervalo
              id={`topo-qr-${tipo}`}
              rotulo="Distância do topo"
              valor={form.topoQr}
              onChange={(valor) => alterar("topoQr", valor)}
              min={0}
              max={limitesQr.topo}
              passo={0.5}
              unidade=" mm"
              erro={erros.topoQr}
            />
            <CampoIntervalo
              id={`tamanho-qr-${tipo}`}
              rotulo="Tamanho"
              valor={form.tamanhoQr}
              onChange={alterarTamanhoQr}
              min={15}
              max={60}
              unidade=" mm"
              erro={erros.tamanhoQr}
            />
            <CampoSelecao
              id={`codigo-qr-${tipo}`}
              rotulo="Código embaixo do QR"
              value={form.alinhamentoCodigoQr}
              onChange={(evento) => alterar("alinhamentoCodigoQr", evento.target.value)}
            >
              {OPCOES_CODIGO_QR.map((opcao) => (
                <option key={opcao.valor} value={opcao.valor}>
                  {opcao.rotulo}
                </option>
              ))}
            </CampoSelecao>
            <div className={stylesCampo.grupo}>
              <label htmlFor={`cor-qr-${tipo}`} className={stylesCampo.rotulo}>
                Cor do QR code
              </label>
              <div className={styles.linhaCor}>
                <input
                  id={`cor-qr-${tipo}`}
                  type="color"
                  className={styles.seletorCor}
                  value={form.corQr || "#000000"}
                  onChange={(evento) => alterar("corQr", evento.target.value.toUpperCase())}
                />
                <code className={styles.valorCor}>{form.corQr || "#000000"}</code>
              </div>
            </div>
          </div>
        </Secao>

        {!TIPOS_SEM_CARGA.includes(tipo) && (
          <Secao titulo="Carga horária" descricao={AJUDA_CARGA[tipo]}>
            <div className={styles.campoCurto}>
              <CampoNumero
                id={`carga-${tipo}`}
                rotulo="Carga horária (horas)"
                value={form.cargaHoraria}
                onValueChange={(evento) => alterar("cargaHoraria", evento.value ?? null)}
                min={1}
                max={2000}
                erro={erros.cargaHoraria}
              />
            </div>
          </Secao>
        )}
      </div>

      <aside className={styles.lateral} aria-label="Prévia e ações">
        <PreviaCertificado modelo={form} valores={valoresPrevia} pagina={pagina} aoCarregarFundo={setDimensoes} />
        <p className={styles.textoApoio}>
          Prévia aproximada, com dados de exemplo. Use &quot;Pré-visualizar PDF&quot; para ver o arquivo final.
        </p>

        <div className={styles.acoesModelo}>
          <Botao type="button" variante="secundario" carregando={gerandoPrevia} onClick={previsualizarPdf}>
            <Eye size={18} strokeWidth={1.5} aria-hidden="true" />
            Pré-visualizar PDF
          </Botao>
          <Botao type="button" carregando={salvando} disabled={!alterado} onClick={salvar}>
            <Save size={18} strokeWidth={1.5} aria-hidden="true" />
            Salvar modelo
          </Botao>
        </div>
        <p className={styles.textoApoio}>
          {alterado
            ? "Há alterações não salvas."
            : modeloSalvo.salvo
              ? "Modelo salvo."
              : TIPOS_LIBERADOS_COM_RESULTADO.includes(tipo)
                ? "Ainda vale o modelo padrão — as cartas usam ele até você salvar um modelo próprio."
                : "Este tipo ainda usa o modelo padrão — salve para poder liberar os certificados."}
        </p>

        {outrosTipos.length > 0 && (
          <div className={styles.copiarLayout}>
            <CampoSelecao
              id={`copiar-${tipo}`}
              rotulo={`Copiar fundo e layout de outro tipo (A4 ${orientacao})`}
              value={origemCopia}
              onChange={(evento) => setOrigemCopia(evento.target.value)}
            >
              <option value="">Escolha o tipo</option>
              {outrosTipos.map((outro) => (
                <option key={outro.tipo} value={outro.tipo}>
                  {outro.rotulo}
                </option>
              ))}
            </CampoSelecao>
            <Botao type="button" variante="secundario" disabled={!origemCopia} onClick={copiarLayout}>
              <Copy size={18} strokeWidth={1.5} aria-hidden="true" />
              Copiar
            </Botao>
          </div>
        )}
      </aside>
    </div>
  );
}
