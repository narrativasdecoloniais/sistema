"use client";

import { useState } from "react";
import { Button } from "primereact/button";
import CampoTexto from "./CampoTexto";
import Alerta from "@/components/forms/Alerta";
import { apiClient } from "@/lib/apiClient";
import { tipoPontoInteresseSchema, extrairErros } from "@/lib/validacao";
import { useToast } from "./ToastProvider";
import stylesCampo from "./CampoPrime.module.scss";
import styles from "./TipoPontoInteresseForm.module.scss";

const COR_PADRAO = "#9c4a2f";

export default function TipoPontoInteresseForm({ tipoPontoInteresseInicial, aoSalvar, aoCancelar }) {
  const { notificar } = useToast();
  const modoEdicao = Boolean(tipoPontoInteresseInicial);

  const [dados, setDados] = useState({
    nome: tipoPontoInteresseInicial?.nome || "",
    cor: tipoPontoInteresseInicial?.cor || COR_PADRAO,
  });
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function aoSubmeter(evento) {
    evento.preventDefault();
    setErroGeral("");

    const resultado = tipoPontoInteresseSchema.safeParse(dados);
    if (!resultado.success) {
      setErros(extrairErros(resultado));
      return;
    }
    setErros({});
    setSalvando(true);

    try {
      const resposta = modoEdicao
        ? await apiClient.patch(`/tipos-ponto-interesse/${tipoPontoInteresseInicial.id}`, resultado.data)
        : await apiClient.post("/tipos-ponto-interesse", resultado.data);
      notificar(
        modoEdicao
          ? "Tipo de ponto de referência atualizado com sucesso."
          : "Tipo de ponto de referência criado com sucesso."
      );
      aoSalvar(resposta.tipoPontoInteresse);
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
        rotulo="Nome do tipo de ponto de referência"
        value={dados.nome}
        onChange={(evento) => setDados((atual) => ({ ...atual, nome: evento.target.value }))}
        erro={erros.nome}
      />
      <div className={stylesCampo.grupo}>
        <span className={stylesCampo.rotulo}>Cor no mapa</span>
        <div className={styles.campoCor}>
          <input
            type="color"
            value={dados.cor}
            onChange={(evento) => setDados((atual) => ({ ...atual, cor: evento.target.value }))}
            className={styles.seletorCor}
          />
          <span className={styles.valorCor}>{dados.cor}</span>
        </div>
        {erros.cor && <p className={stylesCampo.mensagemErro}>{erros.cor}</p>}
      </div>
      <div className={styles.acoes}>
        <Button
          type="button"
          label="Cancelar"
          onClick={aoCancelar}
          pt={{ root: { className: styles.botaoSecundario } }}
        />
        <Button
          type="submit"
          label={salvando ? "Aguarde..." : modoEdicao ? "Salvar" : "Criar tipo de ponto de referência"}
          disabled={salvando}
          pt={{ root: { className: styles.botaoPrimario } }}
        />
      </div>
    </form>
  );
}
