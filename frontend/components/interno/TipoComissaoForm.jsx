"use client";

import { useState } from "react";
import { Button } from "primereact/button";
import CampoTexto from "./CampoTexto";
import Alerta from "@/components/forms/Alerta";
import { apiClient } from "@/lib/apiClient";
import { tipoComissaoSchema, extrairErros } from "@/lib/validacao";
import { useToast } from "./ToastProvider";
import styles from "./TipoComissaoForm.module.scss";

export default function TipoComissaoForm({ tipoComissaoInicial, aoSalvar, aoCancelar }) {
  const { notificar } = useToast();
  const modoEdicao = Boolean(tipoComissaoInicial);

  const [dados, setDados] = useState({ nome: tipoComissaoInicial?.nome || "" });
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function aoSubmeter(evento) {
    evento.preventDefault();
    setErroGeral("");

    const resultado = tipoComissaoSchema.safeParse(dados);
    if (!resultado.success) {
      setErros(extrairErros(resultado));
      return;
    }
    setErros({});
    setSalvando(true);

    try {
      const resposta = modoEdicao
        ? await apiClient.patch(`/tipos-comissao/${tipoComissaoInicial.id}`, resultado.data)
        : await apiClient.post("/tipos-comissao", resultado.data);
      notificar(
        modoEdicao ? "Tipo de comissão atualizado com sucesso." : "Tipo de comissão criado com sucesso."
      );
      aoSalvar(resposta.tipoComissao);
    } catch (erro) {
      setErroGeral(erro.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={aoSubmeter} className={styles.formulario}>
      <Alerta>{erroGeral}</Alerta>
      <CampoTexto
        id="nome"
        rotulo="Nome do tipo de comissão"
        value={dados.nome}
        onChange={(evento) => setDados({ nome: evento.target.value })}
        erro={erros.nome}
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
          label={salvando ? "Aguarde..." : modoEdicao ? "Salvar" : "Criar tipo de comissão"}
          disabled={salvando}
          pt={{ root: { className: styles.botaoPrimario } }}
        />
      </div>
    </form>
  );
}
