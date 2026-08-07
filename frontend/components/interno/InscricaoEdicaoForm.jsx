"use client";

import { useState } from "react";
import { Button } from "primereact/button";
import BuscaUsuario from "./BuscaUsuario";
import Alerta from "@/components/forms/Alerta";
import { apiClient } from "@/lib/apiClient";
import { inscricaoEdicaoAdminSchema, extrairErros } from "@/lib/validacao";
import { useToast } from "./ToastProvider";
import styles from "./InscricaoEdicaoForm.module.scss";

export default function InscricaoEdicaoForm({ edicaoId, aoSalvar, aoCancelar }) {
  const { notificar } = useToast();

  const [usuario, setUsuario] = useState(null);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function aoSubmeter(evento) {
    evento.preventDefault();
    setErroGeral("");

    const resultado = inscricaoEdicaoAdminSchema.safeParse({ usuarioId: usuario?.id || "" });
    if (!resultado.success) {
      setErros(extrairErros(resultado));
      return;
    }
    setErros({});
    setSalvando(true);

    try {
      const resposta = await apiClient.post(`/edicoes/${edicaoId}/inscricoes-gerais`, resultado.data);
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
      <BuscaUsuario
        rotulo="Participante"
        usuarioSelecionado={usuario}
        onSelecionar={setUsuario}
        erro={erros.usuarioId}
      />
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
