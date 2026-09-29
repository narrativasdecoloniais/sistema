"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import { redimensionarLogoParaDataUri } from "@/lib/imagem";
import stylesCampo from "./Campo.module.scss";
import styles from "./CampoRichText.module.scss";

// Também disponíveis: "titulos" (título h2 + subtítulo h3) e "listaNumerada".
const FERRAMENTAS_PADRAO = ["negrito", "italico", "lista", "link"];

// O Word (e o resto do Office) manda o texto de "text/html" com o
// documento inteiro em volta do trecho selecionado — o trecho real fica
// delimitado por esses comentários. Sem recortar por eles, o conteúdo de
// contexto que sobra fora do trecho selecionado vaza junto e duplica o que
// foi colado.
function recortarFragmentoHtml(html) {
  const inicio = html.indexOf("<!--StartFragment-->");
  const fim = html.indexOf("<!--EndFragment-->");
  if (inicio === -1 || fim === -1) return html;
  return html.slice(inicio + "<!--StartFragment-->".length, fim);
}

// Editor rico compartilhado entre admin e público (headless — TipTap não tem
// CSS/tema próprio), estilizado só com os tokens semânticos --cor-* (ver
// _tokens-publico.scss/_tokens-interno.scss), igual aos outros forms/*.
// Toolbar em texto puro (sem lib de ícone) — DESIGN.md proíbe libs de ícone
// no site público, e este componente é usado nos dois. `ferramentas`
// controla tanto quais botões aparecem quanto o que o schema do editor
// permite (ex. referência bibliográfica passa só ["negrito"], então nem
// itálico/lista/link funcionam por atalho de teclado). `permitirImagem`
// liga a extensão de imagem + botão de inserir arquivo; `permitirTabela` liga
// tabelas (inserir, linhas/colunas, cabeçalho, excluir). `aoEnviarImagem`
// (opcional) recebe o data URI já redimensionado e devolve a URL final —
// usado pelo editor da organização, que salva sozinho e não pode ficar
// reenviando data URI a cada autosave. HTML sempre sanitizado de novo no
// backend antes de salvar — nunca confiar só no editor.
export default function CampoRichText({
  id,
  rotulo,
  value,
  onChange,
  onBlur,
  erro,
  ferramentas = FERRAMENTAS_PADRAO,
  permitirImagem = false,
  permitirTabela = false,
  aoEnviarImagem,
  alto = false,
}) {
  const idErro = `${id}-erro`;
  const inputImagemRef = useRef(null);
  const [enviandoImagem, setEnviandoImagem] = useState(false);
  const [erroImagem, setErroImagem] = useState("");
  // A barra depende de "o cursor está numa tabela?" — re-renderiza a cada
  // mudança de seleção pra mostrar/esconder as ações de tabela.
  const [, atualizarBarra] = useReducer((contador) => contador + 1, 0);

  const temTitulos = ferramentas.includes("titulos");
  const temListaNumerada = ferramentas.includes("listaNumerada");
  const temNegrito = ferramentas.includes("negrito");
  const temItalico = ferramentas.includes("italico");
  const temLista = ferramentas.includes("lista");
  const temLink = ferramentas.includes("link");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // "titulos": título (h2) e subtítulo (h3) — o h1 é o da própria página.
        heading: temTitulos ? { levels: [2, 3] } : false,
        bold: temNegrito,
        italic: temItalico,
        bulletList: temLista,
        orderedList: temLista || temListaNumerada,
        listItem: temLista || temListaNumerada,
      }),
      ...(temLink
        ? [
            Link.configure({
              openOnClick: false,
              autolink: false,
              HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
            }),
          ]
        : []),
      ...(permitirImagem ? [Image.configure({ HTMLAttributes: { alt: "" } })] : []),
      ...(permitirTabela ? [TableKit.configure({ table: { resizable: false } })] : []),
    ],
    content: value || "",
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
    onBlur: () => onBlur?.(),
    onSelectionUpdate: () => atualizarBarra(),
    editorProps: {
      attributes: {
        id,
        class: `${styles.entrada} ${alto ? styles.entradaAlta : ""}`,
        "aria-invalid": erro ? "true" : undefined,
        "aria-describedby": erro ? idErro : undefined,
      },
      // Todo paste vira texto puro — nunca preserva negrito/itálico/cor/
      // fonte/alinhamento de onde a pessoa copiou (Word, Google Docs etc.),
      // só o conteúdo em si; cada quebra de linha vira um parágrafo. Quem
      // quiser negrito/itálico/lista aplica pelos botões da barra depois de
      // colar. Quando permitirImagem, ainda extrai eventual foto embutida
      // no HTML colado (ver comentário mais abaixo) — o texto em si nunca
      // vem do HTML, só do clipboard como text/plain.
      handlePaste: (_view, evento) => {
        const clipboardData = evento.clipboardData;
        if (!clipboardData) return false;

        const texto = clipboardData.getData("text/plain");

        // Imagem embutida no HTML colado (ex. um parágrafo com uma foto no
        // meio, copiado do Word) — o Chrome normalmente já resolve pra um
        // data URI autocontido quando a imagem "de verdade" está ali; o
        // resto do HTML (texto formatado) é descartado de propósito, só
        // usamos ele pra achar a imagem. O recorte por Start/EndFragment
        // evita pegar imagem de contexto que sobrou fora do que foi
        // selecionado.
        const html = permitirImagem ? recortarFragmentoHtml(clipboardData.getData("text/html")) : "";
        const documento = html.trim() ? new DOMParser().parseFromString(html, "text/html") : null;
        const imagensEmbutidas = documento
          ? Array.from(documento.querySelectorAll("img"))
              .map((img) => img.getAttribute("src") || "")
              .filter((src) => src.startsWith("data:image/"))
          : [];

        // Arquivo de imagem "solto" no clipboard (kind: "file") — existe
        // quando a pessoa copia só a foto (sem nenhuma palavra
        // selecionada). Com texto junto, esse arquivo costuma ser uma
        // renderização de toda a seleção (texto + imagem juntos, como um
        // bitmap só) em vez da foto isolada, então só é confiável quando
        // não tem texto nenhum — daí a checagem lá embaixo.
        const arquivosSoltos = permitirImagem
          ? Array.from(clipboardData.items || [])
              .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
              .map((item) => item.getAsFile())
              .filter(Boolean)
          : [];

        if (!texto.trim() && imagensEmbutidas.length === 0 && arquivosSoltos.length === 0) return false;

        evento.preventDefault();

        const paragrafos = texto
          .split(/\r?\n/)
          .map((linha) => linha.trim())
          .filter(Boolean)
          .map((linha) => ({ type: "paragraph", content: [{ type: "text", text: linha }] }));
        if (paragrafos.length > 0) {
          editor.chain().focus().insertContent(paragrafos).run();
        }

        // Redimensiona antes de inserir — o data URI que veio embutido no
        // HTML é do tamanho original da foto (às vezes vários MB), e sem
        // isso passa fácil do limite de tamanho que o backend aceita pro
        // resumo (ver sanitizarResumoSubmissao.js).
        imagensEmbutidas.forEach((src) => {
          fetch(src)
            .then((resposta) => resposta.blob())
            .then((arquivo) => inserirImagem(arquivo));
        });

        if (!texto.trim()) {
          arquivosSoltos.forEach((arquivo) => inserirImagem(arquivo));
        }

        return true;
      },
    },
  });

  // Resincroniza só quando o campo não está focado — durante a digitação,
  // nunca sobrescreve o que a pessoa está escrevendo.
  useEffect(() => {
    if (!editor || editor.isFocused) return;
    if ((value || "") !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [value, editor]);

  function aoClicarLink() {
    const urlAtual = editor.getAttributes("link").href || "";
    const url = window.prompt("URL do link:", urlAtual);
    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }

  // Redimensiona (fotos de celular/Word chegam com vários MB) e, se houver
  // aoEnviarImagem, sobe antes de inserir — o editor fica só com a URL.
  async function inserirImagem(arquivo) {
    setErroImagem("");
    const dataUri = await redimensionarLogoParaDataUri(arquivo, 900, 0.85, true);
    if (!aoEnviarImagem) {
      editor.chain().focus().setImage({ src: dataUri, alt: "" }).run();
      return;
    }
    setEnviandoImagem(true);
    try {
      const url = await aoEnviarImagem(dataUri);
      editor.chain().focus().setImage({ src: url, alt: "" }).run();
    } catch (falha) {
      setErroImagem(falha.message || "Não foi possível enviar a imagem.");
    } finally {
      setEnviandoImagem(false);
    }
  }

  async function aoSelecionarImagem(evento) {
    const arquivo = evento.target.files?.[0];
    evento.target.value = "";
    if (!arquivo) return;
    if (!arquivo.type.startsWith("image/")) return;
    await inserirImagem(arquivo);
  }

  const naTabela = permitirTabela && Boolean(editor?.isActive("table"));
  const acoesTabela = [
    { rotulo: "+ linha", titulo: "Inserir linha abaixo", executar: (c) => c.addRowAfter() },
    { rotulo: "+ coluna", titulo: "Inserir coluna à direita", executar: (c) => c.addColumnAfter() },
    { rotulo: "− linha", titulo: "Excluir linha", executar: (c) => c.deleteRow() },
    { rotulo: "− coluna", titulo: "Excluir coluna", executar: (c) => c.deleteColumn() },
    { rotulo: "Cabeçalho", titulo: "Alternar linha de cabeçalho", executar: (c) => c.toggleHeaderRow() },
    { rotulo: "Excluir tabela", titulo: "Excluir tabela", executar: (c) => c.deleteTable() },
  ];

  return (
    <div className={stylesCampo.grupo}>
      <label htmlFor={id} className={stylesCampo.rotulo}>
        {rotulo}
      </label>
      <div className={`${styles.caixa} ${erro ? styles.invalido : ""}`}>
        <div className={styles.barra} role="toolbar" aria-label="Formatação do texto">
          {temTitulos &&
            [
              { nivel: 2, rotulo: "Título" },
              { nivel: 3, rotulo: "Subtítulo" },
            ].map(({ nivel, rotulo: rotuloTitulo }) => (
              <button
                key={nivel}
                type="button"
                className={`${styles.botao} ${editor?.isActive("heading", { level: nivel }) ? styles.ativo : ""}`}
                onClick={() => editor.chain().focus().toggleHeading({ level: nivel }).run()}
                aria-label={rotuloTitulo}
                aria-pressed={editor?.isActive("heading", { level: nivel }) ?? false}
              >
                {rotuloTitulo}
              </button>
            ))}
          {temNegrito && (
            <button
              type="button"
              className={`${styles.botao} ${editor?.isActive("bold") ? styles.ativo : ""}`}
              onClick={() => editor.chain().focus().toggleBold().run()}
              aria-label="Negrito"
              aria-pressed={editor?.isActive("bold") ?? false}
            >
              <strong>B</strong>
            </button>
          )}
          {temItalico && (
            <button
              type="button"
              className={`${styles.botao} ${editor?.isActive("italic") ? styles.ativo : ""}`}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              aria-label="Itálico"
              aria-pressed={editor?.isActive("italic") ?? false}
            >
              <em>I</em>
            </button>
          )}
          {temLista && (
            <button
              type="button"
              className={`${styles.botao} ${editor?.isActive("bulletList") ? styles.ativo : ""}`}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              aria-label="Lista"
              aria-pressed={editor?.isActive("bulletList") ?? false}
            >
              Lista
            </button>
          )}
          {temListaNumerada && (
            <button
              type="button"
              className={`${styles.botao} ${editor?.isActive("orderedList") ? styles.ativo : ""}`}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              aria-label="Lista numerada"
              aria-pressed={editor?.isActive("orderedList") ?? false}
            >
              Lista numerada
            </button>
          )}
          {temLink && (
            <button
              type="button"
              className={`${styles.botao} ${editor?.isActive("link") ? styles.ativo : ""}`}
              onClick={aoClicarLink}
              aria-label="Link"
              aria-pressed={editor?.isActive("link") ?? false}
            >
              Link
            </button>
          )}
          {permitirImagem && (
            <>
              <button
                type="button"
                className={styles.botao}
                onClick={() => inputImagemRef.current?.click()}
                aria-label="Inserir imagem"
                disabled={enviandoImagem}
              >
                {enviandoImagem ? "Enviando..." : "Imagem"}
              </button>
              <input
                ref={inputImagemRef}
                type="file"
                accept="image/*"
                hidden
                onChange={aoSelecionarImagem}
              />
            </>
          )}
          {permitirTabela && (
            <button
              type="button"
              className={styles.botao}
              onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
              aria-label="Inserir tabela"
              disabled={naTabela}
            >
              Tabela
            </button>
          )}
          {naTabela && (
            <>
              <span className={styles.separador} aria-hidden="true" />
              {acoesTabela.map((acao) => (
                <button
                  key={acao.rotulo}
                  type="button"
                  className={styles.botao}
                  title={acao.titulo}
                  aria-label={acao.titulo}
                  onClick={() => acao.executar(editor.chain().focus()).run()}
                >
                  {acao.rotulo}
                </button>
              ))}
            </>
          )}
        </div>
        <div className={permitirTabela ? styles.caixaRolavel : undefined}>
          <EditorContent editor={editor} />
        </div>
      </div>
      {erroImagem && <p className={stylesCampo.mensagemErro}>{erroImagem}</p>}
      {erro && (
        <p id={idErro} className={stylesCampo.mensagemErro}>
          {erro}
        </p>
      )}
    </div>
  );
}
