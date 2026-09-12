"use client";

import { useState } from "react";
import BuscaUsuario from "./BuscaUsuario";
import Campo from "@/components/forms/Campo";
import Botao from "@/components/forms/Botao";
import Alerta from "@/components/forms/Alerta";
import { apiClient } from "@/lib/apiClient";
import { alterarEmailUsuarioSchema, extrairErros } from "@/lib/validacao";
import { useToast } from "./ToastProvider";
import styles from "./ParticipanteForm.module.scss";

export default function AlterarEmailUsuarioForm({ aoSalvar, aoCancelar }) {
  const { notificar } = useToast();

  const [usuario, setUsuario] = useState(null);
  const [novoEmail, setNovoEmail] = useState("");
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [salvando, setSalvando] = useState(false);

  function selecionarUsuario(selecionado) {
    setUsuario(selecionado);
    setNovoEmail(selecionado?.email || "");
    setErros({});
    setErroGeral("");
  }

  async function aoSubmeter(evento) {
    evento.preventDefault();
    setErroGeral("");

    if (!usuario) {
      setErros({ usuario: "Selecione um usuário" });
      return;
    }

    const resultado = alterarEmailUsuarioSchema.safeParse({ email: novoEmail });
    if (!resultado.success) {
      setErros(extrairErros(resultado));
      return;
    }
    setErros({});
    setSalvando(true);

    try {
      const resposta = await apiClient.patch(`/usuarios/${usuario.id}/email`, resultado.data);
      notificar("E-mail atualizado com sucesso.");
      aoSalvar(resposta.usuario);
    } catch (erro) {
      setErroGeral(erro.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={aoSubmeter} className={styles.formulario}>
      <Alerta>{erroGeral}</Alerta>
      <BuscaUsuario usuarioSelecionado={usuario} onSelecionar={selecionarUsuario} erro={erros.usuario} />
      {usuario && (
        <Campo
          id="novo-email"
          rotulo="Novo e-mail"
          type="email"
          value={novoEmail}
          onChange={(evento) => setNovoEmail(evento.target.value)}
          erro={erros.email}
        />
      )}
      <div className={styles.acoes}>
        <Botao type="button" variante="secundario" onClick={aoCancelar}>
          Cancelar
        </Botao>
        <Botao type="submit" carregando={salvando} disabled={!usuario}>
          Salvar e-mail
        </Botao>
      </div>
    </form>
  );
}
