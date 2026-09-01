"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "primereact/button";
import CampoTexto from "./CampoTexto";
import CampoArea from "./CampoArea";
import Campo from "@/components/forms/Campo";
import Alerta from "@/components/forms/Alerta";
import ModalConfirmacao from "./ModalConfirmacao";
import AreaSubmissaoLinha from "./AreaSubmissaoLinha";
import { apiClient } from "@/lib/apiClient";
import { modalidadeSubmissaoSchema, extrairErros } from "@/lib/validacao";
import { gerarSlug } from "@/lib/slug";
import { paraData } from "@/lib/dataHoraIngenua";
import { useToast } from "./ToastProvider";
import styles from "./AtividadeForm.module.scss";

function estadoInicial(modalidadeInicial) {
  return {
    slug: modalidadeInicial?.slug || "",
    nome: modalidadeInicial?.nome || "",
    subtitulo: modalidadeInicial?.subtitulo || "",
    prazoInicio: modalidadeInicial?.prazoInicio || "",
    prazoFim: modalidadeInicial?.prazoFim || "",
    resumoCurto: modalidadeInicial?.resumoCurto || "",
    perguntaTitulo: modalidadeInicial?.perguntaTitulo || "",
    descricao: modalidadeInicial?.descricao || "",
    linkRotulo: modalidadeInicial?.linkRotulo || "Saiba mais",
    rotuloItem: modalidadeInicial?.rotuloItem || "Área",
    // localId é só de identidade na UI (chave React, linha expandida) —
    // área nova ganha um UUID cliente-only; existente reusa o id do banco.
    // Nunca é lido pelo backend: o zod (modo strip por padrão) descarta a
    // chave antes do envio.
    areas: (modalidadeInicial?.areas || []).map((area) => ({
      id: area.id,
      localId: area.id,
      slug: area.slug,
      titulo: area.titulo,
      descricao: area.descricao || "",
      atividadeIds: (area.atividades || []).map((atividade) => atividade.id),
    })),
  };
}

export default function ModalidadeSubmissaoForm({
  edicaoId,
  modalidadeInicial,
  atividadesDisponiveis,
  aoSalvar,
  aoCancelar,
  aoExcluir,
}) {
  const { notificar } = useToast();
  const modoEdicao = Boolean(modalidadeInicial);

  const [dados, setDados] = useState(() => estadoInicial(modalidadeInicial));
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [areaExpandidaId, setAreaExpandidaId] = useState(null);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  async function aoConfirmarExclusao() {
    setExcluindo(true);
    try {
      await aoExcluir(modalidadeInicial.id);
    } finally {
      setExcluindo(false);
      setConfirmandoExclusao(false);
    }
  }

  function atualizarCampo(campo, valor) {
    setDados((atual) => ({ ...atual, [campo]: valor }));
  }

  function aoMudarNome(valor) {
    setDados((atual) => ({
      ...atual,
      nome: valor,
      // Só gera o slug a partir do nome na criação — numa modalidade já
      // existente, o link público não deve mudar quando o nome é editado.
      slug: modoEdicao ? atual.slug : gerarSlug(valor),
    }));
  }

  function aoMudarArea(indice, campo, valor) {
    setDados((atual) => {
      const areas = [...atual.areas];
      areas[indice] = { ...areas[indice], [campo]: valor };
      return { ...atual, areas };
    });
  }

  function aoAdicionarArea() {
    const localId = crypto.randomUUID();
    setDados((atual) => ({
      ...atual,
      areas: [...atual.areas, { localId, slug: "", titulo: "", descricao: "", atividadeIds: [] }],
    }));
    setAreaExpandidaId(localId);
  }

  function aoRemoverArea(indice) {
    const localId = dados.areas[indice]?.localId;
    setDados((atual) => ({ ...atual, areas: atual.areas.filter((_, i) => i !== indice) }));
    setAreaExpandidaId((atual) => (atual === localId ? null : atual));
  }

  function aoAlternarExpandirArea(localId) {
    setAreaExpandidaId((atual) => (atual === localId ? null : localId));
  }

  // Troca de posição a área movida com a adjacente — lista plana, sem
  // agrupamento (áreas não têm categoria como as pessoas de atividade).
  function moverArea(localId, direcao) {
    setDados((atual) => {
      const { areas } = atual;
      const indiceAtual = areas.findIndex((area) => area.localId === localId);
      if (indiceAtual === -1) return atual;

      const indiceAlvo = indiceAtual + direcao;
      if (indiceAlvo < 0 || indiceAlvo >= areas.length) return atual;

      const novasAreas = [...areas];
      [novasAreas[indiceAtual], novasAreas[indiceAlvo]] = [novasAreas[indiceAlvo], novasAreas[indiceAtual]];
      return { ...atual, areas: novasAreas };
    });
  }

  async function aoSubmeter(evento) {
    evento.preventDefault();
    setErroGeral("");

    const resultado = modalidadeSubmissaoSchema.safeParse(dados);
    if (!resultado.success) {
      setErros(extrairErros(resultado));
      return;
    }
    setErros({});
    setSalvando(true);

    try {
      const resposta = modoEdicao
        ? await apiClient.patch(
            `/edicoes/${edicaoId}/modalidades-submissao/${modalidadeInicial.id}`,
            resultado.data
          )
        : await apiClient.post(`/edicoes/${edicaoId}/modalidades-submissao`, resultado.data);
      notificar(
        modoEdicao ? "Modalidade atualizada com sucesso." : "Modalidade criada com sucesso."
      );
      aoSalvar(resposta.modalidade);
    } catch (erro) {
      setErroGeral(erro.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
    <form onSubmit={aoSubmeter} className={styles.formulario}>
      <Alerta>{erroGeral}</Alerta>
      <CampoTexto
        id="nome"
        rotulo="Nome da modalidade"
        value={dados.nome}
        onChange={(evento) => aoMudarNome(evento.target.value)}
        erro={erros.nome}
      />
      <CampoTexto
        id="subtitulo"
        rotulo="Subtítulo (opcional)"
        value={dados.subtitulo}
        onChange={(evento) => atualizarCampo("subtitulo", evento.target.value)}
        erro={erros.subtitulo}
      />
      <div className={styles.linha}>
        <Campo
          id="prazo-inicio"
          rotulo="Início do prazo de submissão"
          type="date"
          value={paraData(dados.prazoInicio)}
          onChange={(evento) => atualizarCampo("prazoInicio", evento.target.value)}
          erro={erros.prazoInicio}
        />
        <Campo
          id="prazo-fim"
          rotulo="Fim do prazo de submissão"
          type="date"
          value={paraData(dados.prazoFim)}
          onChange={(evento) => atualizarCampo("prazoFim", evento.target.value)}
          erro={erros.prazoFim}
        />
      </div>
      <CampoArea
        id="resumoCurto"
        rotulo="Resumo curto (exibido no card da home)"
        linhas={3}
        value={dados.resumoCurto}
        onChange={(evento) => atualizarCampo("resumoCurto", evento.target.value)}
        erro={erros.resumoCurto}
      />
      <CampoTexto
        id="perguntaTitulo"
        rotulo="Título da seção de descrição"
        value={dados.perguntaTitulo}
        onChange={(evento) => atualizarCampo("perguntaTitulo", evento.target.value)}
        erro={erros.perguntaTitulo}
      />
      <CampoArea
        id="descricao"
        rotulo="Descrição (opcional)"
        linhas={6}
        value={dados.descricao}
        onChange={(evento) => atualizarCampo("descricao", evento.target.value)}
        erro={erros.descricao}
      />
      <CampoTexto
        id="linkRotulo"
        rotulo="Rótulo do link para a página da modalidade"
        value={dados.linkRotulo}
        onChange={(evento) => atualizarCampo("linkRotulo", evento.target.value)}
        erro={erros.linkRotulo}
      />
      <CampoTexto
        id="rotuloItem"
        rotulo="Rótulo das áreas — ex.: Conversatório, exibido como Conversatório 1, Conversatório 2..."
        value={dados.rotuloItem}
        onChange={(evento) => atualizarCampo("rotuloItem", evento.target.value)}
        erro={erros.rotuloItem}
      />

      <div className={styles.secaoPessoas}>
        <span className={styles.rotuloLista}>Áreas temáticas</span>
        {dados.areas.map((area, indice) => (
          <AreaSubmissaoLinha
            key={area.localId}
            area={area}
            indiceFlat={indice}
            expandida={areaExpandidaId === area.localId}
            podeSubir={indice > 0}
            podeDescer={indice < dados.areas.length - 1}
            erros={erros}
            atividadesDisponiveis={atividadesDisponiveis}
            outrasAreas={dados.areas}
            aoAlternarExpandir={() => aoAlternarExpandirArea(area.localId)}
            aoMudarCampo={(campo, valor) => aoMudarArea(indice, campo, valor)}
            aoMover={(direcao) => moverArea(area.localId, direcao)}
            aoRemover={() => aoRemoverArea(indice)}
          />
        ))}
        <Button
          type="button"
          label="Adicionar área"
          onClick={aoAdicionarArea}
          pt={{ root: { className: styles.botaoSecundario } }}
        />
      </div>

      <div className={`${styles.acoes} ${modoEdicao && aoExcluir ? styles.acoesComExcluir : ""}`}>
        {modoEdicao && aoExcluir && (
          <button
            type="button"
            className={styles.botaoPerigo}
            onClick={() => setConfirmandoExclusao(true)}
          >
            <Trash2 size={16} strokeWidth={1.5} aria-hidden="true" />
            Excluir modalidade
          </button>
        )}
        <div className={styles.acoesPrincipais}>
          <Button
            type="button"
            label="Cancelar"
            onClick={aoCancelar}
            pt={{ root: { className: styles.botaoSecundario } }}
          />
          <Button
            type="submit"
            label={salvando ? "Aguarde..." : modoEdicao ? "Salvar" : "Criar modalidade"}
            disabled={salvando}
            pt={{ root: { className: styles.botaoPrimario } }}
          />
        </div>
      </div>
    </form>
    {confirmandoExclusao && (
      <ModalConfirmacao
        titulo="Excluir modalidade"
        mensagem={`Tem certeza que deseja excluir "${modalidadeInicial?.nome}"? Essa ação também remove todas as áreas cadastradas nela e não pode ser desfeita.`}
        confirmando={excluindo}
        onConfirmar={aoConfirmarExclusao}
        onCancelar={() => setConfirmandoExclusao(false)}
      />
    )}
    </>
  );
}
