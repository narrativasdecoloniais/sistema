"use client";

import { useState } from "react";
import { z } from "zod";
import { HandCoins } from "lucide-react";
import { useToast } from "./ToastProvider";
import { apiClient } from "@/lib/apiClient";
import { extrairErros } from "@/lib/validacao";
import CampoTexto from "./CampoTexto";
import CampoRichText from "./CampoRichText";
import CampoRadioSecao from "./CampoRadioSecao";
import CampoLogo from "./CampoLogo";
import CabecalhoSecao from "./CabecalhoSecao";
import styles from "./EdicaoForm.module.scss";

const OPCOES_TIPO_ACAO = [
  { valor: "NENHUMA", rotulo: "Nenhuma" },
  { valor: "LINK", rotulo: "Link" },
  { valor: "COPIAR", rotulo: "Valor para copiar" },
];

const schema = z
  .object({
    tituloContribuicao: z.string().trim().optional(),
    corpoContribuicao: z.string().trim().optional(),
    tipoAcaoContribuicao: z.enum(["NENHUMA", "LINK", "COPIAR"]).optional(),
    linkContribuicaoUrl: z.string().trim().url("Link inválido").optional().or(z.literal("")),
    linkContribuicaoRotulo: z.string().trim().optional(),
    copiaContribuicaoValor: z.string().trim().optional(),
    copiaContribuicaoRotulo: z.string().trim().optional(),
    qrCodeContribuicao: z.string().nullable().optional(),
  })
  .refine((d) => d.tipoAcaoContribuicao !== "LINK" || Boolean(d.linkContribuicaoUrl?.trim()), {
    message: "Informe a URL do link",
    path: ["linkContribuicaoUrl"],
  })
  .refine((d) => d.tipoAcaoContribuicao !== "COPIAR" || Boolean(d.copiaContribuicaoValor?.trim()), {
    message: "Informe o valor a ser copiado",
    path: ["copiaContribuicaoValor"],
  });

// Mensagem de contribuição voluntária mostrada na etapa final da inscrição
// pública (ver CardContribuicao.jsx) — só aparece lá quando `corpo` está
// preenchido. Segue a arquitetura de TextoSecaoForm.jsx (estado local por
// campo + autosave via PATCH /edicoes/:id), mas sem cor/opacidade/faixa:
// este bloco não é uma dobra da home, é específico da confirmação.
export default function ContribuicaoForm({ edicaoInicial }) {
  const { notificar } = useToast();

  const [titulo, setTitulo] = useState(edicaoInicial.tituloContribuicao || "");
  const [corpo, setCorpo] = useState(edicaoInicial.corpoContribuicao || "");
  const [tipoAcao, setTipoAcao] = useState(edicaoInicial.tipoAcaoContribuicao || "NENHUMA");
  const [linkUrl, setLinkUrl] = useState(edicaoInicial.linkContribuicaoUrl || "");
  const [linkRotulo, setLinkRotulo] = useState(edicaoInicial.linkContribuicaoRotulo || "");
  const [copiaValor, setCopiaValor] = useState(edicaoInicial.copiaContribuicaoValor || "");
  const [copiaRotulo, setCopiaRotulo] = useState(edicaoInicial.copiaContribuicaoRotulo || "");
  const [qrCode, setQrCode] = useState(edicaoInicial.qrCodeContribuicao || null);
  const [erros, setErros] = useState({});

  async function salvar(overrides = {}) {
    const resultado = schema.safeParse({
      tituloContribuicao: overrides.tituloContribuicao ?? titulo,
      corpoContribuicao: overrides.corpoContribuicao ?? corpo,
      tipoAcaoContribuicao: overrides.tipoAcaoContribuicao ?? tipoAcao,
      linkContribuicaoUrl: overrides.linkContribuicaoUrl ?? linkUrl,
      linkContribuicaoRotulo: overrides.linkContribuicaoRotulo ?? linkRotulo,
      copiaContribuicaoValor: overrides.copiaContribuicaoValor ?? copiaValor,
      copiaContribuicaoRotulo: overrides.copiaContribuicaoRotulo ?? copiaRotulo,
      qrCodeContribuicao: "qrCodeContribuicao" in overrides ? overrides.qrCodeContribuicao : qrCode,
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
      setTitulo(resposta.edicao.tituloContribuicao || "");
      setCorpo(resposta.edicao.corpoContribuicao || "");
      setTipoAcao(resposta.edicao.tipoAcaoContribuicao || "NENHUMA");
      setLinkUrl(resposta.edicao.linkContribuicaoUrl || "");
      setLinkRotulo(resposta.edicao.linkContribuicaoRotulo || "");
      setCopiaValor(resposta.edicao.copiaContribuicaoValor || "");
      setCopiaRotulo(resposta.edicao.copiaContribuicaoRotulo || "");
      setQrCode(resposta.edicao.qrCodeContribuicao || null);
      notificar("Página do evento atualizada com sucesso.");
    } catch (erro) {
      notificar(erro.message, "erro");
    }
  }

  // Voltar pra "Nenhuma" é sempre um estado válido, então salva na hora.
  // Trocar pra Link/Copiar só revela os campos dependentes — salvar aqui
  // mandaria a ação escolhida com o campo ainda vazio, batendo no refine.
  function aoMudarTipoAcao(valor) {
    setTipoAcao(valor);
    if (valor === "NENHUMA") salvar({ tipoAcaoContribuicao: valor });
  }

  function aoMudarQrCode(novaImagem) {
    setQrCode(novaImagem);
    salvar({ qrCodeContribuicao: novaImagem });
  }

  return (
    <div className={styles.formulario}>
      <div className={styles.secao}>
        <CabecalhoSecao
          Icone={HandCoins}
          titulo="Contribuição"
          descricao="Mensagem de contribuição voluntária mostrada na etapa final da inscrição — deixe o texto vazio pra não mostrar nada."
        />
        <div className={styles.camposSecao}>
          <CampoTexto
            id="tituloContribuicao"
            rotulo="Título (opcional)"
            value={titulo}
            onChange={(evento) => setTitulo(evento.target.value)}
            onBlur={() => salvar()}
            erro={erros.tituloContribuicao}
          />
          <CampoRichText
            id="corpoContribuicao"
            rotulo="Texto"
            value={corpo}
            onChange={setCorpo}
            onBlur={() => salvar()}
            erro={erros.corpoContribuicao}
          />
          <CampoRadioSecao
            id="tipoAcaoContribuicao"
            rotulo="Ação adicional"
            valor={tipoAcao}
            opcoes={OPCOES_TIPO_ACAO}
            onChange={aoMudarTipoAcao}
          />

          {tipoAcao === "LINK" && (
            <>
              <CampoTexto
                id="linkContribuicaoRotulo"
                rotulo="Rótulo do link"
                value={linkRotulo}
                onChange={(evento) => setLinkRotulo(evento.target.value)}
                onBlur={() => salvar()}
                erro={erros.linkContribuicaoRotulo}
              />
              <CampoTexto
                id="linkContribuicaoUrl"
                rotulo="URL"
                value={linkUrl}
                onChange={(evento) => setLinkUrl(evento.target.value)}
                onBlur={() => salvar()}
                erro={erros.linkContribuicaoUrl}
              />
            </>
          )}

          {tipoAcao === "COPIAR" && (
            <>
              <CampoTexto
                id="copiaContribuicaoRotulo"
                rotulo="Rótulo do valor"
                placeholder="Ex.: Chave PIX"
                value={copiaRotulo}
                onChange={(evento) => setCopiaRotulo(evento.target.value)}
                onBlur={() => salvar()}
                erro={erros.copiaContribuicaoRotulo}
              />
              <CampoTexto
                id="copiaContribuicaoValor"
                rotulo="Valor a copiar"
                value={copiaValor}
                onChange={(evento) => setCopiaValor(evento.target.value)}
                onBlur={() => salvar()}
                erro={erros.copiaContribuicaoValor}
              />
              <CampoLogo
                id="qrCodeContribuicao"
                rotulo="QR code (opcional)"
                valor={qrCode}
                onChange={aoMudarQrCode}
                erro={erros.qrCodeContribuicao}
                dimensaoMax={800}
                textoItem="QR code"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
