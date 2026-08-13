"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "primereact/button";
import { useToast } from "./ToastProvider";
import { apiClient } from "@/lib/apiClient";
import { edicaoSchema, extrairErros } from "@/lib/validacao";
import { gerarSlug } from "@/lib/slug";
import { paraNumeroRomano } from "@/lib/romanos";
import SecaoInformacoesBasicas from "./SecaoInformacoesBasicas";
import SecaoDivulgacao from "./SecaoDivulgacao";
import SecaoLocal from "./SecaoLocal";
import SecaoDataHora from "./SecaoDataHora";
import CabecalhoSecao from "./CabecalhoSecao";
import styles from "./EdicaoForm.module.scss";

function estadoInicial(edicaoInicial) {
  return {
    numero: edicaoInicial?.numero ?? null,
    nome: edicaoInicial?.nome || "",
    descricao: edicaoInicial?.descricao || "",
    dataInicio: edicaoInicial?.dataInicio || "",
    dataFim: edicaoInicial?.dataFim || "",
    slug: edicaoInicial?.slug || "",
    cargaHorariaTotal: edicaoInicial?.cargaHorariaTotal ?? null,
    instagram: edicaoInicial?.instagram || "",
    facebook: edicaoInicial?.facebook || "",
    linksExtras: edicaoInicial?.linksExtras || [],
    modalidade: edicaoInicial?.modalidade || undefined,
    local: edicaoInicial?.local || "",
    pais: edicaoInicial?.pais || "",
    estado: edicaoInicial?.estado || "",
    cidade: edicaoInicial?.cidade || "",
    fusoHorario: edicaoInicial?.fusoHorario || "America/Sao_Paulo",
    notificarAlteracoes: edicaoInicial?.notificarAlteracoes !== false,
  };
}

function paraPayload(dados) {
  return {
    ...dados,
    descricao: dados.descricao || undefined,
    dataInicio: dados.dataInicio || undefined,
    dataFim: dados.dataFim || undefined,
    slug: dados.slug || undefined,
    cargaHorariaTotal: dados.cargaHorariaTotal ?? undefined,
    instagram: dados.instagram || undefined,
    facebook: dados.facebook || undefined,
    local: dados.local || undefined,
    pais: dados.pais || undefined,
    estado: dados.estado || undefined,
    cidade: dados.cidade || undefined,
    modalidade: dados.modalidade || undefined,
    linksExtras: (dados.linksExtras || []).filter(
      (link) => (link.rotulo && link.rotulo.trim()) || (link.url && link.url.trim())
    ),
  };
}

export default function EdicaoForm({ edicaoInicial, resumido = false, usuario }) {
  const router = useRouter();
  const { notificar } = useToast();
  const modoEdicao = Boolean(edicaoInicial);
  const podeExcluir = Boolean(usuario?.papeis?.includes("ADMIN"));

  const [edicao, setEdicao] = useState(() => estadoInicial(edicaoInicial));
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);
  const temporizadorRef = useRef(null);
  // Só gera o slug a partir do número enquanto o admin não tiver digitado
  // um manualmente — e só na criação (depois de salva, o link público não
  // deve mudar sozinho se o número for corrigido).
  const [slugTocado, setSlugTocado] = useState(Boolean(edicaoInicial?.slug));

  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => () => clearTimeout(temporizadorRef.current), []);

  async function salvarCampo(dadosParaSalvar) {
    const alvo = dadosParaSalvar || edicao;
    const resultado = edicaoSchema.safeParse(paraPayload(alvo));
    if (!resultado.success) {
      setErros(extrairErros(resultado));
      return;
    }
    setErros({});

    try {
      await apiClient.patch(`/edicoes/${edicaoInicial.id}`, resultado.data);
      notificar("Edição atualizada com sucesso.");
      router.refresh();
    } catch (erro) {
      notificar(erro.message, "erro");
    }
  }

  function agendarSalvarCampo() {
    clearTimeout(temporizadorRef.current);
    temporizadorRef.current = setTimeout(() => salvarCampo(), 500);
  }

  function aoMudar(campo, valor) {
    if (campo === "slug") setSlugTocado(true);

    setEdicao((atual) => {
      const novo = { ...atual, [campo]: valor };
      if (campo === "numero" && !modoEdicao && !slugTocado) {
        novo.slug = valor ? `${gerarSlug(paraNumeroRomano(valor))}-narrativas` : "";
      }
      return novo;
    });
  }

  function aoMudarImediato(campo, valor) {
    setEdicao((atual) => {
      const novo = { ...atual, [campo]: valor };
      if (modoEdicao) salvarCampo(novo);
      return novo;
    });
  }

  function aoMudarLink(indice, campo, valor) {
    setEdicao((atual) => {
      const links = [...atual.linksExtras];
      links[indice] = { ...links[indice], [campo]: valor };
      return { ...atual, linksExtras: links };
    });
  }

  function aoAdicionarLink() {
    setEdicao((atual) => ({
      ...atual,
      linksExtras: [...atual.linksExtras, { rotulo: "", url: "" }],
    }));
  }

  function aoRemoverLink(indice) {
    setEdicao((atual) => {
      const novo = { ...atual, linksExtras: atual.linksExtras.filter((_, i) => i !== indice) };
      if (modoEdicao) salvarCampo(novo);
      return novo;
    });
  }

  const aoSalvar = modoEdicao ? agendarSalvarCampo : undefined;

  async function criar(evento) {
    evento.preventDefault();

    const resultado = edicaoSchema.safeParse(paraPayload(edicao));
    if (!resultado.success) {
      setErros(extrairErros(resultado));
      return;
    }
    setErros({});
    setSalvando(true);

    try {
      const resposta = await apiClient.post("/edicoes", resultado.data);
      notificar("Edição criada com sucesso.");
      router.push(`/admin/edicoes/${resposta.edicao.id}`);
      router.refresh();
    } catch (erro) {
      notificar(erro.message, "erro");
      setSalvando(false);
    }
  }

  async function excluirEdicao() {
    setExcluindo(true);

    try {
      await apiClient.delete(`/edicoes/${edicaoInicial.id}`);
      notificar("Edição excluída.");
      router.push("/admin");
      router.refresh();
    } catch (erro) {
      notificar(erro.message, "erro");
      setExcluindo(false);
    }
  }

  const secaoInformacoes = (
    <SecaoInformacoesBasicas
      edicao={edicao}
      erros={erros}
      aoMudar={aoMudar}
      aoSalvar={aoSalvar}
      resumido={resumido}
    />
  );

  const secoesCompletas = !resumido && (
    <>
      <SecaoDivulgacao
        edicao={edicao}
        erros={erros}
        aoMudar={aoMudar}
        aoSalvar={aoSalvar}
        aoMudarLink={aoMudarLink}
        aoAdicionarLink={aoAdicionarLink}
        aoRemoverLink={aoRemoverLink}
      />
      <SecaoLocal
        edicao={edicao}
        erros={erros}
        aoMudar={aoMudar}
        aoSalvar={aoSalvar}
        aoMudarImediato={aoMudarImediato}
      />
      <SecaoDataHora
        edicao={edicao}
        erros={erros}
        aoMudar={aoMudar}
        aoSalvar={aoSalvar}
        aoMudarImediato={aoMudarImediato}
      />
    </>
  );

  return (
    <>
      {modoEdicao ? (
        <div className={styles.formulario}>
          {secaoInformacoes}
          {secoesCompletas}
        </div>
      ) : (
        <form onSubmit={criar} className={styles.formulario}>
          {secaoInformacoes}
          {secoesCompletas}
          <Button
            type="submit"
            label={salvando ? "Aguarde..." : "Criar edição"}
            disabled={salvando}
            pt={{ root: { className: styles.botaoPrimario } }}
          />
        </form>
      )}

      {modoEdicao && podeExcluir && (
        <section className={`${styles.formulario} ${styles.secaoPerigo}`}>
          <CabecalhoSecao Icone={Trash2} titulo="Excluir edição" perigo />
          <p className={styles.perigoTexto}>
            Essa ação remove a edição permanentemente e não pode ser desfeita.
          </p>
          {!confirmandoExclusao ? (
            <Button
              type="button"
              label="Excluir edição"
              onClick={() => setConfirmandoExclusao(true)}
              pt={{ root: { className: styles.botaoPerigo } }}
            />
          ) : (
            <div className={styles.linha}>
              <Button
                type="button"
                label={excluindo ? "Aguarde..." : "Confirmar exclusão"}
                disabled={excluindo}
                onClick={excluirEdicao}
                pt={{ root: { className: styles.botaoPerigo } }}
              />
              <Button
                type="button"
                label="Cancelar"
                onClick={() => setConfirmandoExclusao(false)}
                pt={{ root: { className: styles.botaoSecundario } }}
              />
            </div>
          )}
        </section>
      )}
    </>
  );
}
