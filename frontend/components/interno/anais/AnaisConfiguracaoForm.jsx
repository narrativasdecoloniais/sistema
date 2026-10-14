"use client";

import { useState } from "react";
import { BookMarked, Building2, FileText, ImageIcon, ListChecks, Plus, ScrollText, Trash2, Users } from "lucide-react";
import Botao from "@/components/forms/Botao";
import CampoRichText from "@/components/forms/CampoRichText";
import CabecalhoSecao from "../CabecalhoSecao";
import CampoTexto from "../CampoTexto";
import CampoArea from "../CampoArea";
import CampoSelecao from "../CampoSelecao";
import CampoCheckbox from "../CampoCheckbox";
import CampoImagemAnais from "./CampoImagemAnais";
import { useToast } from "../ToastProvider";
import { apiClient } from "@/lib/apiClient";
import { IMAGENS_ANAIS, LICENCAS_ANAIS } from "@/lib/anais";
import { anaisConfiguracaoSchema, extrairErros, isbnValido, normalizarIssn } from "@/lib/validacao";
import styles from "../EdicaoForm.module.scss";
import estilosTabela from "../AvaliacaoSubmissoesPainel.module.scss";
import estilos from "./AnaisPainel.module.scss";
import estilosCampo from "../CampoPrime.module.scss";

// Status que podem entrar nos Anais (espelha DECISOES_PUBLICAVEIS em
// backend/src/utils/criterioAnais.js).
const DECISOES_PUBLICAVEIS = [
  { valor: "APROVADO", rotulo: "Aprovado" },
  { valor: "APROVADO_COM_RESSALVAS", rotulo: "Aprovado com ressalvas" },
  { valor: "APROVADO_FORMATACAO", rotulo: "Aprovado para formatação (pendente de revisão)" },
];

const CREDENCIAMENTOS = [
  { valor: "NAO_EXIGIR", rotulo: "Não exigir credenciamento" },
  { valor: "ALGUM_AUTOR", rotulo: "Pelo menos um dos autores se credenciou" },
  { valor: "AUTOR_PRINCIPAL", rotulo: "O autor principal se credenciou" },
];

function formInicial(anais) {
  return {
    titulo: anais.titulo || "",
    subtitulo: anais.subtitulo || "",
    nomeEvento: anais.nomeEvento || "",
    issn: anais.issn || "",
    isbn: anais.isbn || "",
    editora: anais.editora || "",
    localPublicacao: anais.localPublicacao || "",
    anoPublicacao: anais.anoPublicacao ? String(anais.anoPublicacao) : "",
    organizadores: anais.organizadores || [],
    licenca: anais.licenca || "CC_BY",
    apresentacao: anais.apresentacao || "",
    fichaCatalografica: anais.fichaCatalografica || "",
    cabecalhoArtigoTitulo: anais.cabecalhoArtigoTitulo || "",
    cabecalhoArtigoTexto: anais.cabecalhoArtigoTexto || "",
    gruposConteudoIds: anais.gruposConteudoIds || [],
    imagemCapa: anais.imagemCapa || null,
    imagemCabecalho: anais.imagemCabecalho || null,
    imagemRodape: anais.imagemRodape || null,
    imagemModeloPagina: anais.imagemModeloPagina || null,
    decisoesPublicadas: anais.decisoesPublicadas || ["APROVADO_FORMATACAO"],
    exigirCorrecaoConcluida: Boolean(anais.exigirCorrecaoConcluida),
    credenciamentoExigido: anais.credenciamentoExigido || "ALGUM_AUTOR",
  };
}

// Validação ao sair do campo, só para os identificadores (dígito verificador).
function erroIdentificador(campo, valor) {
  if (!valor.trim()) return undefined;
  if (campo === "issn" && !normalizarIssn(valor)) return "ISSN inválido — confira os 8 dígitos (ex. 1234-5679)";
  if (campo === "isbn" && !isbnValido(valor)) return "ISBN inválido — confira os 10 ou 13 dígitos";
  return undefined;
}

// Dados da publicação dos Anais — tudo o que aparece na folha de rosto do
// PDF/Word, nas páginas públicas e na referência ABNT dos trabalhos — e as
// imagens opcionais de capa e de cabeçalho/rodapé dos trabalhos.
// totalNoCriterio: trabalhos que entram com o critério salvo (visíveis +
// ocultos), recalculado a cada salvamento.
// cabecalhoArtigoPadrao: texto automático do cabeçalho do PDF de cada
// trabalho (calculado pelo backend com a configuração salva).
export default function AnaisConfiguracaoForm({
  edicaoId,
  anais,
  grupos,
  totalNoCriterio,
  cabecalhoArtigoPadrao,
  aoSalvar,
}) {
  const { notificar } = useToast();
  const [form, setForm] = useState(() => formInicial(anais));
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);

  function alterar(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
    if (erros[campo]) setErros((atual) => ({ ...atual, [campo]: undefined }));
  }

  function alterarOrganizador(indice, valor) {
    alterar(
      "organizadores",
      form.organizadores.map((nome, i) => (i === indice ? valor : nome))
    );
  }

  function alternarDecisao(valor, marcado) {
    alterar(
      "decisoesPublicadas",
      marcado ? [...form.decisoesPublicadas, valor] : form.decisoesPublicadas.filter((item) => item !== valor)
    );
  }

  function alternarGrupo(id, marcado) {
    alterar(
      "gruposConteudoIds",
      marcado ? [...form.gruposConteudoIds, id] : form.gruposConteudoIds.filter((item) => item !== id)
    );
  }

  async function salvar(evento) {
    evento.preventDefault();
    const dados = {
      ...form,
      organizadores: form.organizadores.map((nome) => nome.trim()).filter(Boolean),
      // Tabela sem texto ainda conta como conteúdo.
      apresentacao:
        form.apresentacao.replace(/<[^>]*>/g, "").trim() || form.apresentacao.includes("<table") ? form.apresentacao : null,
    };
    const resultado = anaisConfiguracaoSchema.safeParse(dados);
    if (!resultado.success) {
      setErros(extrairErros(resultado));
      notificar("Revise os campos destacados.", "erro");
      return;
    }
    setErros({});
    setSalvando(true);
    try {
      const resposta = await apiClient.put(`/edicoes/${edicaoId}/anais/configuracao`, {
        ...dados,
        anoPublicacao: dados.anoPublicacao || null,
      });
      notificar(resposta.mensagem);
      setForm(formInicial(resposta.anais));
      await aoSalvar();
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form className={styles.formulario} onSubmit={salvar} noValidate>
      <div className={styles.secao}>
        <CabecalhoSecao
          Icone={ListChecks}
          titulo="Trabalhos publicados"
          descricao="Quais trabalhos entram nos Anais — nas páginas públicas e no PDF/Word. Vale na hora para os Anais já publicados. Coautor sem conta no sistema não tem como se credenciar."
        />
        <div className={styles.camposSecao}>
          <fieldset className={estilos.grupoCampos}>
            <legend>Status da submissão</legend>
            {DECISOES_PUBLICAVEIS.map((decisao) => (
              <CampoCheckbox
                key={decisao.valor}
                id={`anais-decisao-${decisao.valor}`}
                rotulo={decisao.rotulo}
                checked={form.decisoesPublicadas.includes(decisao.valor)}
                onChange={(marcado) => alternarDecisao(decisao.valor, marcado)}
              />
            ))}
            {erros.decisoesPublicadas && <p className={estilosCampo.mensagemErro}>{erros.decisoesPublicadas}</p>}
          </fieldset>
          <CampoCheckbox
            id="anais-exigir-correcao"
            rotulo="Só com a revisão ou correção concluída (vale para “com ressalvas” e “para formatação”)"
            checked={form.exigirCorrecaoConcluida}
            onChange={(marcado) => alterar("exigirCorrecaoConcluida", marcado)}
          />
          <CampoSelecao
            id="anais-credenciamento"
            rotulo="Credenciamento no evento"
            value={form.credenciamentoExigido}
            onChange={(e) => alterar("credenciamentoExigido", e.target.value)}
            erro={erros.credenciamentoExigido}
          >
            {CREDENCIAMENTOS.map((opcao) => (
              <option key={opcao.valor} value={opcao.valor}>
                {opcao.rotulo}
              </option>
            ))}
          </CampoSelecao>
          {typeof totalNoCriterio === "number" && (
            <p className={estilosTabela.textoApoio}>
              Com o critério salvo, {totalNoCriterio} {totalNoCriterio === 1 ? "trabalho entra" : "trabalhos entram"} nos
              Anais (incluindo os ocultos na aba Trabalhos). Salve para recalcular.
            </p>
          )}
        </div>
      </div>

      <div className={styles.secao}>
        <CabecalhoSecao
          Icone={BookMarked}
          titulo="Identificação"
          descricao="Título que aparece na folha de rosto, nas páginas públicas e na referência de cada trabalho. O nome do evento entra na referência ABNT sem o número da edição (ex. “In: NOME DO EVENTO, 5., 2026, Brasília”)."
        />
        <div className={styles.camposSecao}>
          <CampoTexto
            id="anais-titulo"
            rotulo="Título dos Anais"
            value={form.titulo}
            maxLength={300}
            onChange={(e) => alterar("titulo", e.target.value)}
            erro={erros.titulo}
          />
          <CampoTexto
            id="anais-subtitulo"
            rotulo="Subtítulo (opcional)"
            value={form.subtitulo}
            maxLength={300}
            onChange={(e) => alterar("subtitulo", e.target.value)}
            erro={erros.subtitulo}
          />
          <CampoTexto
            id="anais-nome-evento"
            rotulo="Nome do evento na referência"
            value={form.nomeEvento}
            maxLength={300}
            onChange={(e) => alterar("nomeEvento", e.target.value)}
            erro={erros.nomeEvento}
          />
          <div className={styles.linha}>
            <CampoTexto
              id="anais-issn"
              rotulo="ISSN (opcional)"
              value={form.issn}
              placeholder="0000-0000"
              maxLength={20}
              onChange={(e) => alterar("issn", e.target.value)}
              onBlur={() => setErros((atual) => ({ ...atual, issn: erroIdentificador("issn", form.issn) }))}
              erro={erros.issn}
            />
            <CampoTexto
              id="anais-isbn"
              rotulo="ISBN (opcional)"
              value={form.isbn}
              placeholder="978-00-00000-00-0"
              maxLength={30}
              onChange={(e) => alterar("isbn", e.target.value)}
              onBlur={() => setErros((atual) => ({ ...atual, isbn: erroIdentificador("isbn", form.isbn) }))}
              erro={erros.isbn}
            />
          </div>
        </div>
      </div>

      <div className={styles.secao}>
        <CabecalhoSecao
          Icone={ImageIcon}
          titulo="Capa, modelo de página, cabeçalho e rodapé"
          descricao="Imagens do PDF/Word dos Anais, todas opcionais. A capa ocupa a primeira página inteira — sem ela, os Anais começam na folha de rosto. O modelo de página é uma arte A4 que fica no fundo de todas as outras páginas, por baixo do texto. O cabeçalho e o rodapé aparecem, de borda a borda, em todas as páginas dos trabalhos (inclusive no PDF de cada trabalho), por cima do modelo; o cabeçalho em imagem substitui a linha com o título e o ISSN/ISBN. Depois de trocar uma imagem, gere os arquivos de novo."
        />
        <div className={styles.camposSecao}>
          <CampoImagemAnais
            id="anais-imagem-capa"
            rotulo="Capa"
            tipo="capa"
            valor={form.imagemCapa}
            onChange={(valor) => alterar("imagemCapa", valor)}
            erro={erros.imagemCapa}
            dimensaoMax={IMAGENS_ANAIS.capa.dimensaoMax}
            orientacao={`A4 retrato. Recomendado: ${IMAGENS_ANAIS.capa.recomendada.largura} × ${IMAGENS_ANAIS.capa.recomendada.altura} px (300 dpi); mínimo ${IMAGENS_ANAIS.capa.minima.largura} × ${IMAGENS_ANAIS.capa.minima.altura} px. PNG ou JPG, até 20 MB. A arte entra como está — título e demais textos da capa vão na própria imagem.`}
          />
          <CampoImagemAnais
            id="anais-imagem-modelo-pagina"
            rotulo="Modelo de página"
            tipo="pagina"
            valor={form.imagemModeloPagina}
            onChange={(valor) => alterar("imagemModeloPagina", valor)}
            erro={erros.imagemModeloPagina}
            dimensaoMax={IMAGENS_ANAIS.capa.dimensaoMax}
            orientacao={`A4 retrato, no fundo de todas as páginas depois da capa (inclusive no PDF de cada trabalho). Recomendado: ${IMAGENS_ANAIS.capa.recomendada.largura} × ${IMAGENS_ANAIS.capa.recomendada.altura} px (300 dpi); mínimo ${IMAGENS_ANAIS.capa.minima.largura} × ${IMAGENS_ANAIS.capa.minima.altura} px. PNG ou JPG, até 20 MB; a área transparente fica branca. Deixe os elementos gráficos perto das bordas: no PDF, o texto começa a ~2,3 cm das laterais, ~2,7 cm do topo e ~2,5 cm da base, e a linha do cabeçalho e o número da página ficam a ~1,2 cm e ~1,5 cm das bordas de cima e de baixo (no Word, margens ABNT de 3 cm à esquerda e no topo e 2 cm à direita e na base).`}
          />
          <CampoImagemAnais
            id="anais-imagem-cabecalho"
            rotulo="Cabeçalho dos trabalhos"
            tipo="faixa"
            valor={form.imagemCabecalho}
            onChange={(valor) => alterar("imagemCabecalho", valor)}
            erro={erros.imagemCabecalho}
            dimensaoMax={IMAGENS_ANAIS.faixa.dimensaoMax}
            orientacao={`Faixa na largura da página, encostada no topo. Recomendado: ${IMAGENS_ANAIS.faixa.larguraRecomendada} px de largura e altura de até ~620 px (5,3 cm). PNG (aceita transparência) ou JPG, até 20 MB.`}
          />
          <CampoImagemAnais
            id="anais-imagem-rodape"
            rotulo="Rodapé dos trabalhos"
            tipo="faixa"
            valor={form.imagemRodape}
            onChange={(valor) => alterar("imagemRodape", valor)}
            erro={erros.imagemRodape}
            dimensaoMax={IMAGENS_ANAIS.faixa.dimensaoMax}
            orientacao={`Faixa na largura da página, encostada na base; o número da página fica logo acima. Recomendado: ${IMAGENS_ANAIS.faixa.larguraRecomendada} px de largura e altura de até ~620 px (5,3 cm). PNG (aceita transparência) ou JPG, até 20 MB.`}
          />
        </div>
      </div>

      <div className={styles.secao}>
        <CabecalhoSecao
          Icone={FileText}
          titulo="Cabeçalho do PDF de cada trabalho"
          descricao="Linhas que aparecem no topo do PDF individual de cada trabalho (o que se baixa na página do trabalho), entre “ANAIS” e a modalidade. Não entram nos Anais completos. Deixe em branco para usar o texto automático; depois de salvar, os PDFs dos trabalhos já saem com o texto novo."
        />
        <div className={styles.camposSecao}>
          <CampoTexto
            id="anais-cabecalho-titulo"
            rotulo="Linha em destaque (opcional)"
            value={form.cabecalhoArtigoTitulo}
            placeholder={form.titulo}
            maxLength={300}
            onChange={(e) => alterar("cabecalhoArtigoTitulo", e.target.value)}
            erro={erros.cabecalhoArtigoTitulo}
          />
          <p className={estilos.textoAutomatico}>Em branco, usa o título dos Anais: {form.titulo || "—"}</p>
          <CampoArea
            id="anais-cabecalho-texto"
            rotulo="Linha de informações (opcional)"
            linhas={3}
            value={form.cabecalhoArtigoTexto}
            placeholder={cabecalhoArtigoPadrao?.texto || ""}
            maxLength={600}
            onChange={(e) => alterar("cabecalhoArtigoTexto", e.target.value)}
            erro={erros.cabecalhoArtigoTexto}
          />
          {cabecalhoArtigoPadrao?.texto && (
            <p className={estilos.textoAutomatico}>
              Em branco, usa: {cabecalhoArtigoPadrao.texto}
              {"\n"}(nome da edição, local, período e ISSN/ISBN salvos — quebras de linha são mantidas no PDF)
            </p>
          )}
        </div>
      </div>

      <div className={styles.secao}>
        <CabecalhoSecao
          Icone={Building2}
          titulo="Publicação"
          descricao="Local, editora e ano entram na folha de rosto e na referência (“Brasília: GPDES/UnB, 2026”). A licença aparece nos créditos, nas páginas públicas e nos metadados para buscadores."
        />
        <div className={styles.camposSecao}>
          <div className={styles.linha}>
            <CampoTexto
              id="anais-local"
              rotulo="Local de publicação"
              value={form.localPublicacao}
              maxLength={120}
              onChange={(e) => alterar("localPublicacao", e.target.value)}
              erro={erros.localPublicacao}
            />
            <CampoTexto
              id="anais-ano"
              rotulo="Ano"
              type="number"
              min={1900}
              max={2200}
              value={form.anoPublicacao}
              onChange={(e) => alterar("anoPublicacao", e.target.value)}
              erro={erros.anoPublicacao}
            />
          </div>
          <CampoTexto
            id="anais-editora"
            rotulo="Editora / instituição responsável"
            value={form.editora}
            maxLength={200}
            onChange={(e) => alterar("editora", e.target.value)}
            erro={erros.editora}
          />
          <CampoSelecao
            id="anais-licenca"
            rotulo="Licença"
            value={form.licenca}
            onChange={(e) => alterar("licenca", e.target.value)}
            erro={erros.licenca}
          >
            {Object.entries(LICENCAS_ANAIS).map(([valor, licenca]) => (
              <option key={valor} value={valor}>
                {licenca.url ? `${licenca.sigla} — ${licenca.nome}` : licenca.nome}
              </option>
            ))}
          </CampoSelecao>
        </div>
      </div>

      <div className={styles.secao}>
        <CabecalhoSecao
          Icone={Users}
          titulo="Organização e expediente"
          descricao="Quem organizou os Anais aparece na folha de rosto. Os grupos marcados (de Comissões e Programas) entram na página de expediente do PDF/Word."
        />
        <div className={styles.camposSecao}>
          <ol className={estilos.listaOrganizadores}>
            {form.organizadores.map((nome, indice) => (
              <li key={indice} className={estilos.linhaOrganizador}>
                <div className={estilos.campoOrganizador}>
                  <CampoTexto
                    id={`anais-organizador-${indice}`}
                    rotulo={`Organizador(a) ${indice + 1}`}
                    value={nome}
                    maxLength={200}
                    onChange={(e) => alterarOrganizador(indice, e.target.value)}
                    erro={erros[`organizadores.${indice}`]}
                  />
                </div>
                <button
                  type="button"
                  className={`${estilosTabela.botaoIcone} ${estilosTabela.botaoIconePerigo}`}
                  aria-label={`Remover organizador(a) ${indice + 1}`}
                  onClick={() =>
                    alterar(
                      "organizadores",
                      form.organizadores.filter((_, i) => i !== indice)
                    )
                  }
                >
                  <Trash2 size={16} strokeWidth={1.5} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ol>
          <div>
            <Botao
              type="button"
              variante="secundario"
              onClick={() => alterar("organizadores", [...form.organizadores, ""])}
              disabled={form.organizadores.length >= 30}
            >
              <Plus size={18} strokeWidth={1.5} aria-hidden="true" />
              Adicionar organizador(a)
            </Botao>
          </div>

          {grupos.length > 0 ? (
            <fieldset className={estilos.grupoCampos}>
              <legend>Grupos no expediente</legend>
              {grupos.map((grupo) => (
                <CampoCheckbox
                  key={grupo.id}
                  id={`anais-grupo-${grupo.id}`}
                  rotulo={grupo.nome}
                  checked={form.gruposConteudoIds.includes(grupo.id)}
                  onChange={(marcado) => alternarGrupo(grupo.id, marcado)}
                />
              ))}
            </fieldset>
          ) : (
            <p className={estilosTabela.textoApoio}>
              Nenhum grupo cadastrado em Comissões e Programas — o expediente fica de fora do PDF/Word.
            </p>
          )}
        </div>
      </div>

      <div className={styles.secao}>
        <CabecalhoSecao
          Icone={FileText}
          titulo="Apresentação"
          descricao="Texto de abertura dos Anais, mostrado na página pública e antes do sumário no PDF/Word. Opcional."
        />
        <div className={styles.camposSecao}>
          <CampoRichText
            id="anais-apresentacao"
            rotulo="Texto da apresentação"
            value={form.apresentacao}
            onChange={(valor) => alterar("apresentacao", valor)}
            erro={erros.apresentacao}
            ferramentas={["titulos", "negrito", "italico", "lista", "listaNumerada", "link"]}
            permitirTabela
            alto
          />
        </div>
      </div>

      <div className={styles.secao}>
        <CabecalhoSecao
          Icone={ScrollText}
          titulo="Ficha catalográfica"
          descricao="Cole a ficha elaborada pela biblioteca (CIP) exatamente como recebida — espaços e quebras de linha são mantidos. Entra no verso da folha de rosto. Opcional."
        />
        <div className={styles.camposSecao}>
          <div className={estilos.campoMonoespacado}>
            <CampoArea
              id="anais-ficha"
              rotulo="Ficha catalográfica"
              linhas={10}
              value={form.fichaCatalografica}
              maxLength={4000}
              onChange={(e) => alterar("fichaCatalografica", e.target.value)}
              erro={erros.fichaCatalografica}
            />
          </div>
        </div>
      </div>

      <div className={estilos.rodapeFormulario}>
        <Botao type="submit" carregando={salvando}>
          Salvar configurações
        </Botao>
      </div>
    </form>
  );
}
