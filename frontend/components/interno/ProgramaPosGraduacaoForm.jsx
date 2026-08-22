"use client";

import { useState } from "react";
import { Button } from "primereact/button";
import CampoTexto from "./CampoTexto";
import CampoLogo from "./CampoLogo";
import Alerta from "@/components/forms/Alerta";
import { apiClient } from "@/lib/apiClient";
import { programaPosGraduacaoSchema, extrairErros } from "@/lib/validacao";
import { useToast } from "./ToastProvider";
import styles from "./ProgramaPosGraduacaoForm.module.scss";

export default function ProgramaPosGraduacaoForm({ programaInicial, aoSalvar, aoCancelar }) {
  const { notificar } = useToast();
  const modoEdicao = Boolean(programaInicial);

  const [nome, setNome] = useState(programaInicial?.nome || "");
  const [link, setLink] = useState(programaInicial?.link || "");
  const [imagem, setImagem] = useState(programaInicial?.imagem || null);
  const [imagemAlterada, setImagemAlterada] = useState(false);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [salvando, setSalvando] = useState(false);

  function aoMudarImagem(valor) {
    setImagem(valor);
    setImagemAlterada(true);
  }

  async function aoSubmeter(evento) {
    evento.preventDefault();
    setErroGeral("");

    const payload = { nome: nome.trim(), link: link.trim() || undefined };
    if (imagemAlterada) payload.imagem = imagem;

    const resultado = programaPosGraduacaoSchema.safeParse(payload);
    if (!resultado.success) {
      setErros(extrairErros(resultado));
      return;
    }
    setErros({});
    setSalvando(true);

    try {
      const resposta = modoEdicao
        ? await apiClient.patch(`/programas-pos-graduacao/${programaInicial.id}`, resultado.data)
        : await apiClient.post("/programas-pos-graduacao", resultado.data);
      notificar(
        modoEdicao
          ? "Programa de pós-graduação atualizado com sucesso."
          : "Programa de pós-graduação criado com sucesso."
      );
      aoSalvar(resposta.programa);
    } catch (erro) {
      setErroGeral(erro.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={aoSubmeter} className={styles.formulario}>
      <Alerta>{erroGeral}</Alerta>
      <CampoLogo
        id="imagemPrograma"
        rotulo="Logo (opcional)"
        valor={imagem}
        onChange={aoMudarImagem}
        erro={erros.imagem}
        textoItem="logo"
      />
      <CampoTexto
        id="nomePrograma"
        rotulo="Nome do programa"
        value={nome}
        onChange={(evento) => setNome(evento.target.value)}
        erro={erros.nome}
      />
      <CampoTexto
        id="linkPrograma"
        rotulo="Link (opcional)"
        value={link}
        onChange={(evento) => setLink(evento.target.value)}
        erro={erros.link}
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
          label={salvando ? "Aguarde..." : modoEdicao ? "Salvar" : "Criar programa"}
          disabled={salvando}
          pt={{ root: { className: styles.botaoPrimario } }}
        />
      </div>
    </form>
  );
}
