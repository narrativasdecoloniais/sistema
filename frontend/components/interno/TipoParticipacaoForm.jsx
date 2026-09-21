"use client";

import { useState } from "react";
import { Button } from "primereact/button";
import CampoTexto from "./CampoTexto";
import CampoNumero from "./CampoNumero";
import Alerta from "@/components/forms/Alerta";
import { apiClient } from "@/lib/apiClient";
import { tipoParticipacaoSchema, extrairErros } from "@/lib/validacao";
import { useToast } from "./ToastProvider";
import styles from "./TipoParticipacaoForm.module.scss";

export default function TipoParticipacaoForm({ tipoParticipacaoInicial, aoSalvar, aoCancelar }) {
  const { notificar } = useToast();
  const modoEdicao = Boolean(tipoParticipacaoInicial);

  const [dados, setDados] = useState({
    nome: tipoParticipacaoInicial?.nome || "",
    ordem: tipoParticipacaoInicial?.ordem ?? null,
  });
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function aoSubmeter(evento) {
    evento.preventDefault();
    setErroGeral("");

    const resultado = tipoParticipacaoSchema.safeParse(dados);
    if (!resultado.success) {
      setErros(extrairErros(resultado));
      return;
    }
    setErros({});
    setSalvando(true);

    try {
      const resposta = modoEdicao
        ? await apiClient.patch(`/tipos-participacao/${tipoParticipacaoInicial.id}`, resultado.data)
        : await apiClient.post("/tipos-participacao", resultado.data);
      notificar(
        modoEdicao
          ? "Tipo de participação atualizado com sucesso."
          : "Tipo de participação criado com sucesso."
      );
      aoSalvar(resposta.tipoParticipacao);
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
        rotulo="Nome do tipo de participação"
        value={dados.nome}
        onChange={(evento) => setDados((atual) => ({ ...atual, nome: evento.target.value }))}
        erro={erros.nome}
      />
      <CampoNumero
        id="ordem"
        rotulo="Ordem de exibição (opcional)"
        value={dados.ordem}
        min={1}
        onValueChange={(evento) => setDados((atual) => ({ ...atual, ordem: evento.value ?? null }))}
        erro={erros.ordem}
      />
      <p className={styles.ajuda}>
        Define a posição deste tipo nas páginas das atividades (1 aparece primeiro). Deixe em branco
        para não definir uma ordem.
      </p>
      <div className={styles.acoes}>
        <Button
          type="button"
          label="Cancelar"
          onClick={aoCancelar}
          pt={{ root: { className: styles.botaoSecundario } }}
        />
        <Button
          type="submit"
          label={salvando ? "Aguarde..." : modoEdicao ? "Salvar" : "Criar tipo de participação"}
          disabled={salvando}
          pt={{ root: { className: styles.botaoPrimario } }}
        />
      </div>
    </form>
  );
}
