"use client";

import { useState } from "react";
import { z } from "zod";
import { useToast } from "./ToastProvider";
import { apiClient } from "@/lib/apiClient";
import { edicaoApoiadorSchema, extrairErros } from "@/lib/validacao";
import SecaoApoio from "./SecaoApoio";
import styles from "./EdicaoForm.module.scss";

const PALETA_PUBLICA = ["TINTA", "BARRO", "OCRE", "BUZIO", "AREIA", "PAPEL", "CERRADO"];

const apoioSchema = z.object({
  apoiadores: z.array(edicaoApoiadorSchema).optional(),
  corFundoApoiadores: z.enum(PALETA_PUBLICA).optional(),
  opacidadeFundoApoiadores: z.number().int().min(0).max(100).optional(),
  mostrarFaixaApoiadores: z.boolean().optional(),
});

function apoiadorParaPayload(apoiador) {
  const payload = { nome: apoiador.nome.trim(), link: apoiador.link?.trim() || undefined };
  if (apoiador.id) payload.id = apoiador.id;
  if (apoiador.imagem && apoiador.imagem.startsWith("data:image/")) payload.imagem = apoiador.imagem;
  return payload;
}

export default function ApoioForm({ edicaoInicial }) {
  const { notificar } = useToast();
  const [apoiadores, setApoiadores] = useState(edicaoInicial.apoiadores || []);
  const [corFundoApoiadores, setCorFundoApoiadores] = useState(edicaoInicial.corFundoApoiadores || "BARRO");
  const [opacidadeFundoApoiadores, setOpacidadeFundoApoiadores] = useState(
    edicaoInicial.opacidadeFundoApoiadores ?? 100
  );
  const [mostrarFaixaApoiadores, setMostrarFaixaApoiadores] = useState(
    edicaoInicial.mostrarFaixaApoiadores ?? true
  );
  const [erros, setErros] = useState({});

  async function salvar(overrides = {}) {
    const resultado = apoioSchema.safeParse({
      apoiadores: (overrides.apoiadores ?? apoiadores).map(apoiadorParaPayload),
      corFundoApoiadores: overrides.corFundoApoiadores ?? corFundoApoiadores,
      opacidadeFundoApoiadores: overrides.opacidadeFundoApoiadores ?? opacidadeFundoApoiadores,
      mostrarFaixaApoiadores: overrides.mostrarFaixaApoiadores ?? mostrarFaixaApoiadores,
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
        corFundoApoiadores: resultado.data.corFundoApoiadores,
        opacidadeFundoApoiadores: resultado.data.opacidadeFundoApoiadores,
        mostrarFaixaApoiadores: resultado.data.mostrarFaixaApoiadores,
        apoiadores: resultado.data.apoiadores,
      });
      setApoiadores(resposta.edicao.apoiadores || []);
      setCorFundoApoiadores(resposta.edicao.corFundoApoiadores);
      setOpacidadeFundoApoiadores(resposta.edicao.opacidadeFundoApoiadores);
      setMostrarFaixaApoiadores(resposta.edicao.mostrarFaixaApoiadores);
      notificar("Página do evento atualizada com sucesso.");
    } catch (erro) {
      notificar(erro.message, "erro");
    }
  }

  function aoMudarApoiador(indice, campo, valor) {
    setApoiadores((atual) => {
      const novo = [...atual];
      novo[indice] = { ...novo[indice], [campo]: valor };
      if (campo === "imagem") salvar({ apoiadores: novo });
      return novo;
    });
  }

  function aoAdicionarApoiador() {
    setApoiadores((atual) => [...atual, { nome: "", imagem: null, link: "" }]);
  }

  function aoRemoverApoiador(indice) {
    setApoiadores((atual) => {
      const novo = atual.filter((_, i) => i !== indice);
      salvar({ apoiadores: novo });
      return novo;
    });
  }

  function aoMudarCorFundo(valor) {
    setCorFundoApoiadores(valor);
    salvar({ corFundoApoiadores: valor });
  }

  function aoMudarOpacidade(valor) {
    setOpacidadeFundoApoiadores(valor);
    salvar({ opacidadeFundoApoiadores: valor });
  }

  function aoMudarMostrarFaixa(valor) {
    setMostrarFaixaApoiadores(valor);
    salvar({ mostrarFaixaApoiadores: valor });
  }

  return (
    <div className={styles.formulario}>
      <SecaoApoio
        apoiadores={apoiadores}
        corFundo={corFundoApoiadores}
        opacidade={opacidadeFundoApoiadores}
        mostrarFaixa={mostrarFaixaApoiadores}
        erros={erros}
        aoMudarApoiador={aoMudarApoiador}
        aoMudarCorFundo={aoMudarCorFundo}
        aoMudarOpacidade={aoMudarOpacidade}
        aoMudarMostrarFaixa={aoMudarMostrarFaixa}
        aoSalvar={() => salvar({})}
        aoAdicionarApoiador={aoAdicionarApoiador}
        aoRemoverApoiador={aoRemoverApoiador}
      />
    </div>
  );
}
