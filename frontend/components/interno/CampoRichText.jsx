"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Bold, Italic, Link as IconeLink, List } from "lucide-react";
import stylesCampo from "./CampoPrime.module.scss";
import styles from "./CampoRichText.module.scss";

// Editor rico hand-rolled (TipTap é headless — sem CSS/tema próprio, só
// lógica de edição), consistente com os outros campos ainda em SCSS Modules
// puro do admin (ver CLAUDE.md). Toolbar mínima de propósito (negrito,
// itálico, lista, link) — sem títulos/cores, pra não fugir da hierarquia
// tipográfica já definida pelo `.paragrafo`/`.titulo` de quem renderiza o
// HTML no público (CardContribuicao.jsx). HTML sanitizado de novo no
// backend antes de salvar (sanitizarCorpoContribuicao.js) — nunca confiar
// só no editor.
export default function CampoRichText({ id, rotulo, value, onChange, onBlur, erro }) {
  const idErro = `${id}-erro`;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      Link.configure({
        openOnClick: false,
        autolink: false,
        HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
      }),
    ],
    content: value || "",
    immediatelyRender: false,
    // isEmpty evita salvar "<p></p>" (o que o TipTap gera pra um editor
    // "vazio") como se fosse conteúdo real — ver checagem espelhada em
    // CardContribuicao.jsx.
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
    onBlur: () => onBlur?.(),
    editorProps: {
      attributes: {
        id,
        class: styles.entrada,
        "aria-invalid": erro ? "true" : undefined,
        "aria-describedby": erro ? idErro : undefined,
      },
    },
  });

  // Resincroniza só quando o campo não está focado (ex. depois de salvar,
  // se o backend normalizou o HTML) — durante a digitação, nunca sobrescreve
  // o que a pessoa está escrevendo.
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

  return (
    <div className={stylesCampo.grupo}>
      <label htmlFor={id} className={stylesCampo.rotulo}>
        {rotulo}
      </label>
      <div className={`${styles.caixa} ${erro ? styles.invalido : ""}`}>
        <div className={styles.barra} role="toolbar" aria-label="Formatação do texto">
          <button
            type="button"
            className={`${styles.botao} ${editor?.isActive("bold") ? styles.ativo : ""}`}
            onClick={() => editor.chain().focus().toggleBold().run()}
            aria-label="Negrito"
            aria-pressed={editor?.isActive("bold") ?? false}
          >
            <Bold size={16} strokeWidth={2} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`${styles.botao} ${editor?.isActive("italic") ? styles.ativo : ""}`}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            aria-label="Itálico"
            aria-pressed={editor?.isActive("italic") ?? false}
          >
            <Italic size={16} strokeWidth={2} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`${styles.botao} ${editor?.isActive("bulletList") ? styles.ativo : ""}`}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            aria-label="Lista"
            aria-pressed={editor?.isActive("bulletList") ?? false}
          >
            <List size={16} strokeWidth={2} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`${styles.botao} ${editor?.isActive("link") ? styles.ativo : ""}`}
            onClick={aoClicarLink}
            aria-label="Link"
            aria-pressed={editor?.isActive("link") ?? false}
          >
            <IconeLink size={16} strokeWidth={2} aria-hidden="true" />
          </button>
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
