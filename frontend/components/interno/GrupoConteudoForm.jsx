"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "primereact/button";
import CampoTexto from "./CampoTexto";
import Alerta from "@/components/forms/Alerta";
import ModalConfirmacao from "./ModalConfirmacao";
import ListaConteudoLinha from "./ListaConteudoLinha";
import { apiClient } from "@/lib/apiClient";
import { grupoConteudoSchema, extrairErros } from "@/lib/validacao";
import { useToast } from "./ToastProvider";
import styles from "./AtividadeForm.module.scss";

function estadoInicial(grupoInicial) {
  return {
    nome: grupoInicial?.nome || "",
    // localId é só de identidade na UI (chave React, linha expandida) —
    // lista/item novo ganha um UUID cliente-only; existente reusa o id do
    // banco. Nunca é lido pelo backend: o zod (modo strip por padrão)
    // descarta a chave antes do envio.
    listas: (grupoInicial?.listas || []).map((lista) => ({
      id: lista.id,
      localId: lista.id,
      nome: lista.nome,
      itens: (lista.itens || []).map((item) => ({
        id: item.id,
        localId: item.id,
        nome: item.nome,
        imagem: item.imagem || null,
        link: item.link || "",
      })),
    })),
  };
}

export default function GrupoConteudoForm({ edicaoId, grupoInicial, aoSalvar, aoCancelar, aoExcluir }) {
  const { notificar } = useToast();
  const modoEdicao = Boolean(grupoInicial);

  const [dados, setDados] = useState(() => estadoInicial(grupoInicial));
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [listaExpandidaId, setListaExpandidaId] = useState(null);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  async function aoConfirmarExclusao() {
    setExcluindo(true);
    try {
      await aoExcluir(grupoInicial.id);
    } finally {
      setExcluindo(false);
      setConfirmandoExclusao(false);
    }
  }

  function atualizarCampo(campo, valor) {
    setDados((atual) => ({ ...atual, [campo]: valor }));
  }

  function aoMudarLista(indice, campo, valor) {
    setDados((atual) => {
      const listas = [...atual.listas];
      listas[indice] = { ...listas[indice], [campo]: valor };
      return { ...atual, listas };
    });
  }

  function aoAdicionarLista() {
    const localId = crypto.randomUUID();
    setDados((atual) => ({
      ...atual,
      listas: [...atual.listas, { localId, nome: "", itens: [] }],
    }));
    setListaExpandidaId(localId);
  }

  function aoRemoverLista(indice) {
    const localId = dados.listas[indice]?.localId;
    setDados((atual) => ({ ...atual, listas: atual.listas.filter((_, i) => i !== indice) }));
    setListaExpandidaId((atual) => (atual === localId ? null : atual));
  }

  function aoAlternarExpandirLista(localId) {
    setListaExpandidaId((atual) => (atual === localId ? null : localId));
  }

  // Lista plana, sem agrupamento — troca de posição com a adjacente.
  function moverLista(localId, direcao) {
    setDados((atual) => {
      const { listas } = atual;
      const indiceAtual = listas.findIndex((lista) => lista.localId === localId);
      if (indiceAtual === -1) return atual;

      const indiceAlvo = indiceAtual + direcao;
      if (indiceAlvo < 0 || indiceAlvo >= listas.length) return atual;

      const novasListas = [...listas];
      [novasListas[indiceAtual], novasListas[indiceAlvo]] = [novasListas[indiceAlvo], novasListas[indiceAtual]];
      return { ...atual, listas: novasListas };
    });
  }

  async function aoSubmeter(evento) {
    evento.preventDefault();
    setErroGeral("");

    const resultado = grupoConteudoSchema.safeParse(dados);
    if (!resultado.success) {
      setErros(extrairErros(resultado));
      return;
    }
    setErros({});
    setSalvando(true);

    try {
      const resposta = modoEdicao
        ? await apiClient.patch(`/edicoes/${edicaoId}/grupos-conteudo/${grupoInicial.id}`, resultado.data)
        : await apiClient.post(`/edicoes/${edicaoId}/grupos-conteudo`, resultado.data);
      notificar(modoEdicao ? "Grupo atualizado com sucesso." : "Grupo criado com sucesso.");
      aoSalvar(resposta.grupo);
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
          rotulo="Nome do grupo"
          value={dados.nome}
          onChange={(evento) => atualizarCampo("nome", evento.target.value)}
          erro={erros.nome}
        />

        <div className={styles.secaoPessoas}>
          <span className={styles.rotuloLista}>Listas</span>
          {dados.listas.map((lista, indice) => (
            <ListaConteudoLinha
              key={lista.localId}
              lista={lista}
              indiceFlat={indice}
              expandida={listaExpandidaId === lista.localId}
              podeSubir={indice > 0}
              podeDescer={indice < dados.listas.length - 1}
              erros={erros}
              aoAlternarExpandir={() => aoAlternarExpandirLista(lista.localId)}
              aoMudarCampo={(campo, valor) => aoMudarLista(indice, campo, valor)}
              aoMover={(direcao) => moverLista(lista.localId, direcao)}
              aoRemover={() => aoRemoverLista(indice)}
            />
          ))}
          <Button
            type="button"
            label="Adicionar lista"
            onClick={aoAdicionarLista}
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
              Excluir grupo
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
              label={salvando ? "Aguarde..." : modoEdicao ? "Salvar" : "Criar grupo"}
              disabled={salvando}
              pt={{ root: { className: styles.botaoPrimario } }}
            />
          </div>
        </div>
      </form>
      {confirmandoExclusao && (
        <ModalConfirmacao
          titulo="Excluir grupo"
          mensagem={`Tem certeza que deseja excluir "${grupoInicial?.nome}"? Essa ação também remove todas as listas e itens cadastrados nele e não pode ser desfeita.`}
          confirmando={excluindo}
          onConfirmar={aoConfirmarExclusao}
          onCancelar={() => setConfirmandoExclusao(false)}
        />
      )}
    </>
  );
}
