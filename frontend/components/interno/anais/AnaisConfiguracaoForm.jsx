"use client";

import { useState } from "react";
import { BookMarked, Building2, FileText, Plus, ScrollText, Trash2, Users } from "lucide-react";
import Botao from "@/components/forms/Botao";
import CampoRichText from "@/components/forms/CampoRichText";
import CabecalhoSecao from "../CabecalhoSecao";
import CampoTexto from "../CampoTexto";
import CampoArea from "../CampoArea";
import CampoSelecao from "../CampoSelecao";
import CampoCheckbox from "../CampoCheckbox";
import { useToast } from "../ToastProvider";
import { apiClient } from "@/lib/apiClient";
import { LICENCAS_ANAIS } from "@/lib/anais";
import { anaisConfiguracaoSchema, extrairErros, isbnValido, normalizarIssn } from "@/lib/validacao";
import styles from "../EdicaoForm.module.scss";
import estilosTabela from "../AvaliacaoSubmissoesPainel.module.scss";
import estilos from "./AnaisPainel.module.scss";

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
    gruposConteudoIds: anais.gruposConteudoIds || [],
  };
}

// Validação ao sair do campo, só para os identificadores (dígito verificador).
function erroIdentificador(campo, valor) {
  if (!valor.trim()) return undefined;
  if (campo === "issn" && !normalizarIssn(valor)) return "ISSN inválido — confira os 8 dígitos (ex. 1234-5679)";
  if (campo === "isbn" && !isbnValido(valor)) return "ISBN inválido — confira os 10 ou 13 dígitos";
  return undefined;
}

// Dados da publicação dos Anais — tudo o que aparece na capa/folha de rosto
// do PDF/Word, nas páginas públicas e na referência ABNT dos trabalhos.
export default function AnaisConfiguracaoForm({ edicaoId, anais, grupos, aoSalvar }) {
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
          Icone={BookMarked}
          titulo="Identificação"
          descricao="Título que aparece na capa, nas páginas públicas e na referência de cada trabalho. O nome do evento entra na referência ABNT sem o número da edição (ex. “In: NOME DO EVENTO, 5., 2026, Brasília”)."
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
