"use client";

import { useState } from "react";
import { z } from "zod";
import { useToast } from "./ToastProvider";
import { apiClient } from "@/lib/apiClient";
import { edicaoPontoInteresseSchema, extrairErros } from "@/lib/validacao";
import ModalConfirmacao from "./ModalConfirmacao";
import SecaoLocalizacao from "./SecaoLocalizacao";
import styles from "./EdicaoForm.module.scss";

const localizacaoSchema = z.object({
  pontosInteresse: z.array(edicaoPontoInteresseSchema).optional(),
  corFundoLocalizacao: z.string().optional(),
  opacidadeFundoLocalizacao: z.number().int().min(0).max(100).optional(),
  corTextoLocalizacao: z.string().optional(),
  mostrarFaixaLocalizacao: z.boolean().optional(),
});

function pontoParaPayload(ponto) {
  const payload = {
    tipoId: ponto.tipoId,
    nome: ponto.nome.trim(),
    endereco: ponto.endereco?.trim() || undefined,
    latitude: ponto.latitude,
    longitude: ponto.longitude,
    link: ponto.link?.trim() || undefined,
  };
  if (ponto.id) payload.id = ponto.id;
  if (ponto.imagem === null || (ponto.imagem && ponto.imagem.startsWith("data:image/"))) {
    payload.imagem = ponto.imagem;
  }
  return payload;
}

export default function LocalizacaoForm({ edicaoInicial, tiposPontoInteresse = [] }) {
  const { notificar } = useToast();
  const [pontosInteresse, setPontosInteresse] = useState(edicaoInicial.pontosInteresse || []);
  const [corFundo, setCorFundo] = useState(edicaoInicial.corFundoLocalizacao || "PAPEL");
  const [opacidade, setOpacidade] = useState(edicaoInicial.opacidadeFundoLocalizacao ?? 100);
  const [corTexto, setCorTexto] = useState(edicaoInicial.corTextoLocalizacao || "TINTA");
  const [mostrarFaixa, setMostrarFaixa] = useState(edicaoInicial.mostrarFaixaLocalizacao ?? true);
  const [erros, setErros] = useState({});
  const [indiceConfirmandoRemocao, setIndiceConfirmandoRemocao] = useState(null);
  const [removendo, setRemovendo] = useState(false);

  async function salvar(overrides = {}) {
    const resultado = localizacaoSchema.safeParse({
      pontosInteresse: (overrides.pontosInteresse ?? pontosInteresse).map(pontoParaPayload),
      corFundoLocalizacao: overrides.corFundoLocalizacao ?? corFundo,
      opacidadeFundoLocalizacao: overrides.opacidadeFundoLocalizacao ?? opacidade,
      corTextoLocalizacao: overrides.corTextoLocalizacao ?? corTexto,
      mostrarFaixaLocalizacao: overrides.mostrarFaixaLocalizacao ?? mostrarFaixa,
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
        ...resultado.data,
      });
      setPontosInteresse(resposta.edicao.pontosInteresse || []);
      setCorFundo(resposta.edicao.corFundoLocalizacao);
      setOpacidade(resposta.edicao.opacidadeFundoLocalizacao);
      setCorTexto(resposta.edicao.corTextoLocalizacao);
      setMostrarFaixa(resposta.edicao.mostrarFaixaLocalizacao);
      notificar("Página do evento atualizada com sucesso.");
    } catch (erro) {
      notificar(erro.message, "erro");
    }
  }

  function aoMudarCorFundo(valor) {
    setCorFundo(valor);
    salvar({ corFundoLocalizacao: valor });
  }

  function aoMudarOpacidade(valor) {
    setOpacidade(valor);
    salvar({ opacidadeFundoLocalizacao: valor });
  }

  function aoMudarCorTexto(valor) {
    setCorTexto(valor);
    salvar({ corTextoLocalizacao: valor });
  }

  function aoMudarMostrarFaixa(valor) {
    setMostrarFaixa(valor);
    salvar({ mostrarFaixaLocalizacao: valor });
  }

  function aoMudarPonto(indice, campo, valor) {
    setPontosInteresse((atual) => {
      const novo = [...atual];
      novo[indice] = { ...novo[indice], [campo]: valor };
      if (campo === "imagem") salvar({ pontosInteresse: novo });
      return novo;
    });
  }

  function aoAdicionarPonto() {
    setPontosInteresse((atual) => [
      ...atual,
      {
        tipoId: tiposPontoInteresse[0]?.id || "",
        nome: "",
        imagem: null,
        endereco: "",
        latitude: null,
        longitude: null,
        link: "",
      },
    ]);
  }

  async function confirmarRemocao() {
    setRemovendo(true);
    const novo = pontosInteresse.filter((_, i) => i !== indiceConfirmandoRemocao);
    await salvar({ pontosInteresse: novo });
    setPontosInteresse(novo);
    setRemovendo(false);
    setIndiceConfirmandoRemocao(null);
  }

  return (
    <div className={styles.formulario}>
      <SecaoLocalizacao
        pontos={pontosInteresse}
        tipos={tiposPontoInteresse}
        corFundo={corFundo}
        opacidade={opacidade}
        corTexto={corTexto}
        mostrarFaixa={mostrarFaixa}
        erros={erros}
        aoMudarPonto={aoMudarPonto}
        aoMudarCorFundo={aoMudarCorFundo}
        aoMudarOpacidade={aoMudarOpacidade}
        aoMudarCorTexto={aoMudarCorTexto}
        aoMudarMostrarFaixa={aoMudarMostrarFaixa}
        aoSalvar={() => salvar({})}
        aoAdicionarPonto={aoAdicionarPonto}
        aoPedirRemocao={setIndiceConfirmandoRemocao}
      />
      {indiceConfirmandoRemocao !== null && (
        <ModalConfirmacao
          titulo="Excluir ponto de interesse"
          mensagem={`Tem certeza que deseja excluir "${pontosInteresse[indiceConfirmandoRemocao]?.nome || "este ponto"}"? Essa ação não pode ser desfeita.`}
          confirmando={removendo}
          onConfirmar={confirmarRemocao}
          onCancelar={() => setIndiceConfirmandoRemocao(null)}
        />
      )}
    </div>
  );
}
