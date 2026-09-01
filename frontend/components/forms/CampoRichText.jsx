"use client";

import { useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { redimensionarLogoParaDataUri } from "@/lib/imagem";
import stylesCampo from "./Campo.module.scss";
import styles from "./CampoRichText.module.scss";

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
// liga a extensão de imagem + botão de inserir arquivo. HTML sempre
// sanitizado de novo no backend antes de salvar — nunca confiar só no editor.
export default function CampoRichText({
  id,
  rotulo,
  value,
  onChange,
  onBlur,
  erro,
  ferramentas = FERRAMENTAS_PADRAO,
  permitirImagem = false,
}) {
  const idErro = `${id}-erro`;
  const inputImagemRef = useRef(null);

  const temNegrito = ferramentas.includes("negrito");
  const temItalico = ferramentas.includes("italico");
  const temLista = ferramentas.includes("lista");
  const temLink = ferramentas.includes("link");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bold: temNegrito,
        italic: temItalico,
        bulletList: temLista,
        orderedList: temLista,
        listItem: temLista,
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
    ],
    content: value || "",
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
    onBlur: () => onBlur?.(),
    editorProps: {
      attributes: {
        id,
        class: styles.entrada,
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
            .then((arquivo) => redimensionarLogoParaDataUri(arquivo, 900, 0.85, true))
            .then((dataUri) => {
              editor.chain().focus().setImage({ src: dataUri, alt: "" }).run();
            });
        });

        if (!texto.trim()) {
          arquivosSoltos.forEach((arquivo) => {
            redimensionarLogoParaDataUri(arquivo, 900, 0.85, true).then((dataUri) => {
              editor.chain().focus().setImage({ src: dataUri, alt: "" }).run();
            });
          });
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

  async function aoSelecionarImagem(evento) {
    const arquivo = evento.target.files?.[0];
    evento.target.value = "";
    if (!arquivo) return;
    if (!arquivo.type.startsWith("image/")) return;

    const dataUri = await redimensionarLogoParaDataUri(arquivo, 900, 0.85, true);
    editor.chain().focus().setImage({ src: dataUri, alt: "" }).run();
  }

  return (
    <div className={stylesCampo.grupo}>
      <label htmlFor={id} className={stylesCampo.rotulo}>
        {rotulo}
      </label>
      <div className={`${styles.caixa} ${erro ? styles.invalido : ""}`}>
        <div className={styles.barra} role="toolbar" aria-label="Formatação do texto">
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
              >
                Imagem
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
        </div>
        <EditorContent editor={editor} />
      </div>
      {erro && (
        <p id={idErro} className={stylesCampo.mensagemErro}>
          {erro}
        </p>
      )}
    </div>
  );
}
