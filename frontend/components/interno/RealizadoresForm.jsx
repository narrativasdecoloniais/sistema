"use client";

import { useState } from "react";
import { z } from "zod";
import { useToast } from "./ToastProvider";
import { apiClient } from "@/lib/apiClient";
import { edicaoRealizadorSchema, extrairErros } from "@/lib/validacao";
import SecaoRealizadores from "./SecaoRealizadores";
import styles from "./EdicaoForm.module.scss";

const PALETA_FUNDO = ["PAPEL", "TINTA", "BARRO", "OCRE", "CERRADO"];

const realizadoresSchema = z.object({
  realizadores: z.array(edicaoRealizadorSchema).optional(),
  corFundoRealizadores: z.enum(PALETA_FUNDO).optional(),
  mostrarFaixaRealizadores: z.boolean().optional(),
});

function realizadorParaPayload(realizador) {
  const payload = { nome: realizador.nome.trim(), link: realizador.link?.trim() || undefined };
  if (realizador.id) payload.id = realizador.id;
  if (realizador.imagem && realizador.imagem.startsWith("data:image/")) payload.imagem = realizador.imagem;
  return payload;
}

export default function RealizadoresForm({ edicaoInicial }) {
  const { notificar } = useToast();
  const [realizadores, setRealizadores] = useState(edicaoInicial.realizadores || []);
  const [corFundoRealizadores, setCorFundoRealizadores] = useState(
    edicaoInicial.corFundoRealizadores || "BARRO"
  );
  const [mostrarFaixaRealizadores, setMostrarFaixaRealizadores] = useState(
    edicaoInicial.mostrarFaixaRealizadores ?? true
  );
  const [erros, setErros] = useState({});

  async function salvar(overrides = {}) {
    const resultado = realizadoresSchema.safeParse({
      realizadores: (overrides.realizadores ?? realizadores).map(realizadorParaPayload),
      corFundoRealizadores: overrides.corFundoRealizadores ?? corFundoRealizadores,
      mostrarFaixaRealizadores: overrides.mostrarFaixaRealizadores ?? mostrarFaixaRealizadores,
    });
    if (!resultado.success) {
      setErros(extrairErros(resultado));
      return;
    }
    setErros({});

    try {
      const resposta = await apiClient.patch(`/edicoes/${edicaoInicial.id}`, {
        numero: edicaoInicial.numero,
        nome: edicaoInicial.nome,
        corFundoRealizadores: resultado.data.corFundoRealizadores,
        mostrarFaixaRealizadores: resultado.data.mostrarFaixaRealizadores,
        realizadores: resultado.data.realizadores,
      });
      setRealizadores(resposta.edicao.realizadores || []);
      setCorFundoRealizadores(resposta.edicao.corFundoRealizadores);
      setMostrarFaixaRealizadores(resposta.edicao.mostrarFaixaRealizadores);
      notificar("Página do evento atualizada com sucesso.");
    } catch (erro) {
      notificar(erro.message, "erro");
    }
  }

  function aoMudarRealizador(indice, campo, valor) {
    setRealizadores((atual) => {
      const novo = [...atual];
      novo[indice] = { ...novo[indice], [campo]: valor };
      if (campo === "imagem") salvar({ realizadores: novo });
      return novo;
    });
  }

  function aoAdicionarRealizador() {
    setRealizadores((atual) => [...atual, { nome: "", imagem: null, link: "" }]);
  }

  function aoRemoverRealizador(indice) {
    setRealizadores((atual) => {
      const novo = atual.filter((_, i) => i !== indice);
      salvar({ realizadores: novo });
      return novo;
    });
  }

  function aoMudarCorFundo(valor) {
    setCorFundoRealizadores(valor);
    salvar({ corFundoRealizadores: valor });
  }

  function aoMudarMostrarFaixa(valor) {
    setMostrarFaixaRealizadores(valor);
    salvar({ mostrarFaixaRealizadores: valor });
  }

  return (
    <div className={styles.formulario}>
      <SecaoRealizadores
        realizadores={realizadores}
        corFundo={corFundoRealizadores}
        mostrarFaixa={mostrarFaixaRealizadores}
        erros={erros}
        aoMudarRealizador={aoMudarRealizador}
        aoMudarCorFundo={aoMudarCorFundo}
        aoMudarMostrarFaixa={aoMudarMostrarFaixa}
        aoSalvar={() => salvar({})}
        aoAdicionarRealizador={aoAdicionarRealizador}
        aoRemoverRealizador={aoRemoverRealizador}
      />
    </div>
  );
}
