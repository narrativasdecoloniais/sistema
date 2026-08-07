"use client";

import { useState } from "react";
import { Button } from "primereact/button";
import CampoSelecao from "./CampoSelecao";
import BuscaUsuario from "./BuscaUsuario";
import Alerta from "@/components/forms/Alerta";
import { apiClient } from "@/lib/apiClient";
import { inscricaoAtividadeAdminSchema, extrairErros } from "@/lib/validacao";
import { useToast } from "./ToastProvider";
import styles from "./InscricaoAtividadeForm.module.scss";

export default function InscricaoAtividadeForm({
  edicaoId,
  atividades,
  atividadeIdInicial,
  aoSalvar,
  aoCancelar,
}) {
  const { notificar } = useToast();

  const [atividadeId, setAtividadeId] = useState(atividadeIdInicial || "");
  const [usuario, setUsuario] = useState(null);
  const [status, setStatus] = useState("CONFIRMADA");
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [salvando, setSalvando] = useState(false);

  const atividadesComInscricao = atividades.filter((atividade) => atividade.exigeInscricao);

  async function aoSubmeter(evento) {
    evento.preventDefault();
    setErroGeral("");

    const resultado = inscricaoAtividadeAdminSchema.safeParse({
      usuarioId: usuario?.id || "",
      atividadeId,
      status,
    });
    if (!resultado.success) {
      setErros(extrairErros(resultado));
      return;
    }
    setErros({});
    setSalvando(true);

    try {
      const resposta = await apiClient.post(
        `/edicoes/${edicaoId}/inscricoes-atividades`,
        resultado.data
      );
      notificar("Inscrição criada com sucesso.");
      aoSalvar(resposta.inscricao);
    } catch (erro) {
      setErroGeral(erro.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={aoSubmeter} className={styles.formulario}>
      <Alerta>{erroGeral}</Alerta>
      <CampoSelecao
        id="atividadeId"
        rotulo="Atividade"
        value={atividadeId}
        onChange={(evento) => setAtividadeId(evento.target.value)}
        erro={erros.atividadeId}
      >
        <option value="">Selecione uma atividade</option>
        {atividadesComInscricao.map((atividade) => (
          <option key={atividade.id} value={atividade.id}>
            {atividade.nome}
          </option>
        ))}
      </CampoSelecao>
      {atividadesComInscricao.length === 0 && (
        <p className={styles.aviso}>
          Nenhuma atividade desta edição exige inscrição no momento.
        </p>
      )}
      <BuscaUsuario
        rotulo="Participante"
        usuarioSelecionado={usuario}
        onSelecionar={setUsuario}
        erro={erros.usuarioId}
      />
      <CampoSelecao
        id="status"
        rotulo="Status"
        value={status}
        onChange={(evento) => setStatus(evento.target.value)}
        erro={erros.status}
      >
        <option value="CONFIRMADA">Confirmada</option>
        <option value="LISTA_ESPERA">Lista de espera</option>
      </CampoSelecao>
      <div className={styles.acoes}>
        <Button
          type="button"
          label="Cancelar"
          onClick={aoCancelar}
          pt={{ root: { className: styles.botaoSecundario } }}
        />
        <Button
          type="submit"
          label={salvando ? "Aguarde..." : "Inscrever"}
          disabled={salvando}
          pt={{ root: { className: styles.botaoPrimario } }}
        />
      </div>
    </form>
  );
}
