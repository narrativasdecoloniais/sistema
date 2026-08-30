"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "primereact/button";
import CampoTexto from "./CampoTexto";
import CampoSelecao from "./CampoSelecao";
import Alerta from "@/components/forms/Alerta";
import ModalConfirmacao from "./ModalConfirmacao";
import { apiClient } from "@/lib/apiClient";
import { comissaoSchema, extrairErros } from "@/lib/validacao";
import { useToast } from "./ToastProvider";
import styles from "./ComissaoForm.module.scss";

function estadoInicial(comissaoInicial) {
  return {
    tipoComissaoId: comissaoInicial?.tipoComissaoId || "",
    // localId é só de identidade na UI (chave React) — integrante novo ganha
    // um UUID cliente-only; integrante existente reusa o id do banco. Nunca
    // é lido pelo backend: o zod (modo strip por padrão) descarta a chave
    // antes do envio.
    membros: (comissaoInicial?.membros || []).map((membro) => ({
      id: membro.id,
      localId: membro.id,
      nome: membro.nome || "",
    })),
  };
}

export default function ComissaoForm({
  edicaoId,
  comissaoInicial,
  tiposComissao,
  aoSalvar,
  aoCancelar,
  aoExcluir,
}) {
  const { notificar } = useToast();
  const modoEdicao = Boolean(comissaoInicial);

  const [dados, setDados] = useState(() => estadoInicial(comissaoInicial));
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  async function aoConfirmarExclusao() {
    setExcluindo(true);
    try {
      await aoExcluir(comissaoInicial.id);
    } finally {
      setExcluindo(false);
      setConfirmandoExclusao(false);
    }
  }

  function atualizarCampo(campo, valor) {
    setDados((atual) => ({ ...atual, [campo]: valor }));
  }

  function aoMudarMembro(indice, valor) {
    setDados((atual) => {
      const membros = [...atual.membros];
      membros[indice] = { ...membros[indice], nome: valor };
      return { ...atual, membros };
    });
  }

  function aoAdicionarMembro() {
    setDados((atual) => ({
      ...atual,
      membros: [...atual.membros, { localId: crypto.randomUUID(), nome: "" }],
    }));
  }

  function aoRemoverMembro(indice) {
    setDados((atual) => ({
      ...atual,
      membros: atual.membros.filter((_, i) => i !== indice),
    }));
  }

  async function aoSubmeter(evento) {
    evento.preventDefault();
    setErroGeral("");

    const resultado = comissaoSchema.safeParse(dados);
    if (!resultado.success) {
      setErros(extrairErros(resultado));
      return;
    }
    setErros({});
    setSalvando(true);

    try {
      const resposta = modoEdicao
        ? await apiClient.patch(`/edicoes/${edicaoId}/comissoes/${comissaoInicial.id}`, resultado.data)
        : await apiClient.post(`/edicoes/${edicaoId}/comissoes`, resultado.data);
      notificar(modoEdicao ? "Comissão atualizada com sucesso." : "Comissão criada com sucesso.");
      aoSalvar(resposta.comissao);
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
        <CampoSelecao
          id="tipoComissaoId"
          rotulo="Tipo de comissão"
          value={dados.tipoComissaoId}
          onChange={(evento) => atualizarCampo("tipoComissaoId", evento.target.value)}
          erro={erros.tipoComissaoId}
        >
          <option value="">Selecione um tipo</option>
          {tiposComissao.map((tipo) => (
            <option key={tipo.id} value={tipo.id}>
              {tipo.nome}
            </option>
          ))}
        </CampoSelecao>
        {tiposComissao.length === 0 && (
          <p className={styles.avisoSemTipos}>
            Nenhum tipo de comissão cadastrado ainda. Crie um em Configurações → Tipos de comissão
            antes de cadastrar a comissão.
          </p>
        )}

        <div className={styles.secaoMembros}>
          <span className={styles.rotuloLista}>Integrantes</span>
          {dados.membros.map((membro, indice) => (
            <div key={membro.localId} className={styles.linhaMembro}>
              <CampoTexto
                id={`membro-${membro.localId}`}
                rotulo={`Integrante ${indice + 1}`}
                value={membro.nome}
                onChange={(evento) => aoMudarMembro(indice, evento.target.value)}
                erro={erros[`membros.${indice}.nome`]}
              />
              <button
                type="button"
                className={styles.botaoRemoverMembro}
                aria-label={`Remover integrante ${indice + 1}`}
                onClick={() => aoRemoverMembro(indice)}
              >
                <Trash2 size={16} strokeWidth={1.5} aria-hidden="true" />
              </button>
            </div>
          ))}
          <Button
            type="button"
            label="Adicionar integrante"
            onClick={aoAdicionarMembro}
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
              Excluir comissão
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
              label={salvando ? "Aguarde..." : modoEdicao ? "Salvar" : "Criar comissão"}
              disabled={salvando}
              pt={{ root: { className: styles.botaoPrimario } }}
            />
          </div>
        </div>
      </form>
      {confirmandoExclusao && (
        <ModalConfirmacao
          titulo="Excluir comissão"
          mensagem={`Tem certeza que deseja excluir a comissão "${comissaoInicial?.tipoComissao?.nome}"? Essa ação não pode ser desfeita.`}
          confirmando={excluindo}
          onConfirmar={aoConfirmarExclusao}
          onCancelar={() => setConfirmandoExclusao(false)}
        />
      )}
    </>
  );
}
