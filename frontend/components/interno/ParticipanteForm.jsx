"use client";

import { useState } from "react";
import Campo from "@/components/forms/Campo";
import Botao from "@/components/forms/Botao";
import Alerta from "@/components/forms/Alerta";
import SeletorSecoesAdmin from "./SeletorSecoesAdmin";
import { apiClient } from "@/lib/apiClient";
import { participanteSchema, extrairErros } from "@/lib/validacao";
import { useToast } from "./ToastProvider";
import styles from "./ParticipanteForm.module.scss";

const valoresIniciais = { nome: "", email: "", acessoCompleto: false, secoesPermitidas: [] };

export default function ParticipanteForm({ aoSalvar, aoCancelar }) {
  const { notificar } = useToast();

  const [dados, setDados] = useState(valoresIniciais);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [salvando, setSalvando] = useState(false);

  function atualizarCampo(campo, valor) {
    setDados((atual) => ({ ...atual, [campo]: valor }));
  }

  async function aoSubmeter(evento) {
    evento.preventDefault();
    setErroGeral("");

    const resultado = participanteSchema.safeParse(dados);
    if (!resultado.success) {
      setErros(extrairErros(resultado));
      return;
    }
    setErros({});
    setSalvando(true);

    try {
      const resposta = await apiClient.post("/organizadores", resultado.data);
      notificar("Organizador adicionado com sucesso.");
      aoSalvar(resposta.organizador);
    } catch (erro) {
      setErroGeral(erro.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={aoSubmeter} className={styles.formulario}>
      <Alerta>{erroGeral}</Alerta>
      <Campo
        id="nome"
        rotulo="Nome completo"
        value={dados.nome}
        onChange={(evento) => atualizarCampo("nome", evento.target.value)}
        erro={erros.nome}
      />
      <Campo
        id="email"
        rotulo="E-mail"
        type="email"
        value={dados.email}
        onChange={(evento) => atualizarCampo("email", evento.target.value)}
        erro={erros.email}
      />
      <SeletorSecoesAdmin
        acessoCompleto={dados.acessoCompleto}
        secoesSelecionadas={dados.secoesPermitidas}
        onAlterarAcessoCompleto={(valor) => atualizarCampo("acessoCompleto", valor)}
        onAlterarSecoes={(valor) => atualizarCampo("secoesPermitidas", valor)}
      />
      <div className={styles.acoes}>
        <Botao type="button" variante="secundario" onClick={aoCancelar}>
          Cancelar
        </Botao>
        <Botao type="submit" carregando={salvando}>
          Adicionar organizador
        </Botao>
      </div>
    </form>
  );
}
