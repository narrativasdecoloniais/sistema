"use client";

import { useState } from "react";
import { z } from "zod";
import { useToast } from "./ToastProvider";
import { apiClient } from "@/lib/apiClient";
import { edicaoRealizadorSchema, extrairErros } from "@/lib/validacao";
import SecaoHero from "./SecaoHero";
import SecaoRealizadores from "./SecaoRealizadores";
import styles from "./EdicaoForm.module.scss";

const PALETA_FUNDO = ["PAPEL", "TINTA", "BARRO", "OCRE", "CERRADO"];
const PALETA_PUBLICA = ["TINTA", "BARRO", "OCRE", "BUZIO", "AREIA", "PAPEL", "CERRADO"];
const TIPO_FAIXA = ["COR", "IMAGEM", "NENHUMA"];
const TIPO_FUNDO = ["COR", "IMAGEM"];

const paginaSchema = z.object({
  logoSvg: z.string().max(300_000).nullable().optional(),
  logoSvgCores: z.record(z.string(), z.string()).nullable().optional(),
  realizadores: z.array(edicaoRealizadorSchema).optional(),
  corFundoRealizadores: z.enum(PALETA_FUNDO).optional(),
  corFundoHero: z.enum(PALETA_FUNDO).optional(),
  opacidadeFundoHero: z.number().int().min(0).max(100).optional(),
  fundoHeroTipo: z.enum(TIPO_FUNDO).optional(),
  imagemFundoHeroDesktop: z.string().max(20_000_000).nullable().optional(),
  imagemFundoHeroMobile: z.string().max(20_000_000).nullable().optional(),
  corTextoHero: z.enum(PALETA_PUBLICA).optional(),
  corBuzioHero: z.enum(PALETA_PUBLICA).optional(),
  faixaHeroTipoDesktop: z.enum(TIPO_FAIXA).optional(),
  corFaixaHeroDesktop: z.enum(PALETA_PUBLICA).optional(),
  imagemFaixaHeroDesktop: z.string().max(8_000_000).nullable().optional(),
  faixaHeroTipoMobile: z.enum(TIPO_FAIXA).optional(),
  corFaixaHeroMobile: z.enum(PALETA_PUBLICA).optional(),
  imagemFaixaHeroMobile: z.string().max(8_000_000).nullable().optional(),
});

function realizadorParaPayload(realizador) {
  const payload = { nome: realizador.nome.trim(), link: realizador.link?.trim() || undefined };
  if (realizador.id) payload.id = realizador.id;
  if (realizador.imagem && realizador.imagem.startsWith("data:image/")) payload.imagem = realizador.imagem;
  return payload;
}

export default function PaginaEventoForm({ edicaoInicial }) {
  const { notificar } = useToast();
  const [realizadores, setRealizadores] = useState(edicaoInicial.realizadores || []);
  const [corFundoRealizadores, setCorFundoRealizadores] = useState(
    edicaoInicial.corFundoRealizadores || "BARRO"
  );
  const [logoSvg, setLogoSvg] = useState(edicaoInicial.logoSvg || null);
  const [logoSvgViewBox, setLogoSvgViewBox] = useState(edicaoInicial.logoSvgViewBox || null);
  const [logoSvgCores, setLogoSvgCores] = useState(edicaoInicial.logoSvgCores || null);
  const [corFundoHero, setCorFundoHero] = useState(edicaoInicial.corFundoHero || "PAPEL");
  const [opacidadeFundoHero, setOpacidadeFundoHero] = useState(
    edicaoInicial.opacidadeFundoHero ?? 100
  );
  const [fundoHeroTipo, setFundoHeroTipo] = useState(edicaoInicial.fundoHeroTipo || "COR");
  const [imagemFundoHeroDesktop, setImagemFundoHeroDesktop] = useState(
    edicaoInicial.imagemFundoHeroDesktop || null
  );
  const [imagemFundoHeroMobile, setImagemFundoHeroMobile] = useState(
    edicaoInicial.imagemFundoHeroMobile || null
  );
  const [corTextoHero, setCorTextoHero] = useState(edicaoInicial.corTextoHero || "TINTA");
  const [corBuzioHero, setCorBuzioHero] = useState(edicaoInicial.corBuzioHero || "BUZIO");
  const [faixaHeroTipoDesktop, setFaixaHeroTipoDesktop] = useState(edicaoInicial.faixaHeroTipoDesktop || "COR");
  const [corFaixaHeroDesktop, setCorFaixaHeroDesktop] = useState(edicaoInicial.corFaixaHeroDesktop || "OCRE");
  const [imagemFaixaHeroDesktop, setImagemFaixaHeroDesktop] = useState(edicaoInicial.imagemFaixaHeroDesktop || null);
  const [faixaHeroTipoMobile, setFaixaHeroTipoMobile] = useState(edicaoInicial.faixaHeroTipoMobile || "COR");
  const [corFaixaHeroMobile, setCorFaixaHeroMobile] = useState(edicaoInicial.corFaixaHeroMobile || "OCRE");
  const [imagemFaixaHeroMobile, setImagemFaixaHeroMobile] = useState(edicaoInicial.imagemFaixaHeroMobile || null);
  const [erros, setErros] = useState({});

  // `overrides` só precisa trazer os campos que mudaram nesta chamada — os
  // demais usam o valor atual do estado (fallback via `??`). logoSvg e as
  // imagens de faixa ficam de fora desse fallback (undefined por padrão, a
  // não ser que venham explícitas em overrides) pra não reenviar centenas de
  // KB de imagem a cada edição de um campo não relacionado.
  async function salvar(overrides = {}) {
    const resultado = paginaSchema.safeParse({
      logoSvg: overrides.logoSvg,
      logoSvgCores: overrides.logoSvgCores,
      realizadores: (overrides.realizadores ?? realizadores).map(realizadorParaPayload),
      corFundoRealizadores: overrides.corFundoRealizadores ?? corFundoRealizadores,
      corFundoHero: overrides.corFundoHero ?? corFundoHero,
      opacidadeFundoHero: overrides.opacidadeFundoHero ?? opacidadeFundoHero,
      fundoHeroTipo: overrides.fundoHeroTipo ?? fundoHeroTipo,
      imagemFundoHeroDesktop: overrides.imagemFundoHeroDesktop,
      imagemFundoHeroMobile: overrides.imagemFundoHeroMobile,
      corTextoHero: overrides.corTextoHero ?? corTextoHero,
      corBuzioHero: overrides.corBuzioHero ?? corBuzioHero,
      faixaHeroTipoDesktop: overrides.faixaHeroTipoDesktop ?? faixaHeroTipoDesktop,
      corFaixaHeroDesktop: overrides.corFaixaHeroDesktop ?? corFaixaHeroDesktop,
      imagemFaixaHeroDesktop: overrides.imagemFaixaHeroDesktop,
      faixaHeroTipoMobile: overrides.faixaHeroTipoMobile ?? faixaHeroTipoMobile,
      corFaixaHeroMobile: overrides.corFaixaHeroMobile ?? corFaixaHeroMobile,
      imagemFaixaHeroMobile: overrides.imagemFaixaHeroMobile,
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
        realizadores: resultado.data.realizadores,
        corFundoHero: resultado.data.corFundoHero,
        opacidadeFundoHero: resultado.data.opacidadeFundoHero,
        fundoHeroTipo: resultado.data.fundoHeroTipo,
        corTextoHero: resultado.data.corTextoHero,
        corBuzioHero: resultado.data.corBuzioHero,
        faixaHeroTipoDesktop: resultado.data.faixaHeroTipoDesktop,
        corFaixaHeroDesktop: resultado.data.corFaixaHeroDesktop,
        faixaHeroTipoMobile: resultado.data.faixaHeroTipoMobile,
        corFaixaHeroMobile: resultado.data.corFaixaHeroMobile,
        ...(resultado.data.logoSvg !== undefined ? { logoSvg: resultado.data.logoSvg } : {}),
        ...(resultado.data.logoSvgCores !== undefined ? { logoSvgCores: resultado.data.logoSvgCores } : {}),
        ...(resultado.data.imagemFaixaHeroDesktop !== undefined
          ? { imagemFaixaHeroDesktop: resultado.data.imagemFaixaHeroDesktop }
          : {}),
        ...(resultado.data.imagemFaixaHeroMobile !== undefined
          ? { imagemFaixaHeroMobile: resultado.data.imagemFaixaHeroMobile }
          : {}),
        ...(resultado.data.imagemFundoHeroDesktop !== undefined
          ? { imagemFundoHeroDesktop: resultado.data.imagemFundoHeroDesktop }
          : {}),
        ...(resultado.data.imagemFundoHeroMobile !== undefined
          ? { imagemFundoHeroMobile: resultado.data.imagemFundoHeroMobile }
          : {}),
      });
      setRealizadores(resposta.edicao.realizadores || []);
      setCorFundoRealizadores(resposta.edicao.corFundoRealizadores);
      setLogoSvg(resposta.edicao.logoSvg || null);
      setLogoSvgViewBox(resposta.edicao.logoSvgViewBox || null);
      setLogoSvgCores(resposta.edicao.logoSvgCores || null);
      setCorFundoHero(resposta.edicao.corFundoHero);
      setOpacidadeFundoHero(resposta.edicao.opacidadeFundoHero);
      setFundoHeroTipo(resposta.edicao.fundoHeroTipo);
      setImagemFundoHeroDesktop(resposta.edicao.imagemFundoHeroDesktop || null);
      setImagemFundoHeroMobile(resposta.edicao.imagemFundoHeroMobile || null);
      setCorTextoHero(resposta.edicao.corTextoHero);
      setCorBuzioHero(resposta.edicao.corBuzioHero);
      setFaixaHeroTipoDesktop(resposta.edicao.faixaHeroTipoDesktop);
      setCorFaixaHeroDesktop(resposta.edicao.corFaixaHeroDesktop);
      setImagemFaixaHeroDesktop(resposta.edicao.imagemFaixaHeroDesktop || null);
      setFaixaHeroTipoMobile(resposta.edicao.faixaHeroTipoMobile);
      setCorFaixaHeroMobile(resposta.edicao.corFaixaHeroMobile);
      setImagemFaixaHeroMobile(resposta.edicao.imagemFaixaHeroMobile || null);
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

  function aoMudarLogo(novoTexto) {
    salvar({ logoSvg: novoTexto });
  }

  function aoMudarLogoCores(novasCores) {
    salvar({ logoSvgCores: novasCores });
  }

  function aoMudarCorFundoHero(valor) {
    setCorFundoHero(valor);
    salvar({ corFundoHero: valor });
  }

  function aoMudarOpacidadeFundoHero(valor) {
    setOpacidadeFundoHero(valor);
    salvar({ opacidadeFundoHero: valor });
  }

  function aoMudarFundoHeroTipo(valor) {
    setFundoHeroTipo(valor);
    salvar({ fundoHeroTipo: valor });
  }

  function aoMudarImagemFundoHeroDesktop(novaImagem) {
    salvar({ imagemFundoHeroDesktop: novaImagem });
  }

  function aoMudarImagemFundoHeroMobile(novaImagem) {
    salvar({ imagemFundoHeroMobile: novaImagem });
  }

  function aoMudarCorTextoHero(valor) {
    setCorTextoHero(valor);
    salvar({ corTextoHero: valor });
  }

  function aoMudarCorBuzioHero(valor) {
    setCorBuzioHero(valor);
    salvar({ corBuzioHero: valor });
  }

  function aoMudarFaixaHeroTipoDesktop(valor) {
    setFaixaHeroTipoDesktop(valor);
    salvar({ faixaHeroTipoDesktop: valor });
  }

  function aoMudarCorFaixaHeroDesktop(valor) {
    setCorFaixaHeroDesktop(valor);
    salvar({ corFaixaHeroDesktop: valor });
  }

  function aoMudarImagemFaixaHeroDesktop(novaImagem) {
    salvar({ imagemFaixaHeroDesktop: novaImagem });
  }

  function aoMudarFaixaHeroTipoMobile(valor) {
    setFaixaHeroTipoMobile(valor);
    salvar({ faixaHeroTipoMobile: valor });
  }

  function aoMudarCorFaixaHeroMobile(valor) {
    setCorFaixaHeroMobile(valor);
    salvar({ corFaixaHeroMobile: valor });
  }

  function aoMudarImagemFaixaHeroMobile(novaImagem) {
    salvar({ imagemFaixaHeroMobile: novaImagem });
  }

  return (
    <div className={styles.formulario}>
      <SecaoHero
        logoSvg={logoSvg}
        logoSvgViewBox={logoSvgViewBox}
        logoSvgCores={logoSvgCores}
        corFundoHero={corFundoHero}
        opacidadeFundoHero={opacidadeFundoHero}
        fundoHeroTipo={fundoHeroTipo}
        imagemFundoHeroDesktop={imagemFundoHeroDesktop}
        imagemFundoHeroMobile={imagemFundoHeroMobile}
        corTextoHero={corTextoHero}
        corBuzioHero={corBuzioHero}
        faixaHeroTipoDesktop={faixaHeroTipoDesktop}
        corFaixaHeroDesktop={corFaixaHeroDesktop}
        imagemFaixaHeroDesktop={imagemFaixaHeroDesktop}
        faixaHeroTipoMobile={faixaHeroTipoMobile}
        corFaixaHeroMobile={corFaixaHeroMobile}
        imagemFaixaHeroMobile={imagemFaixaHeroMobile}
        erro={erros.logoSvg}
        aoMudarLogo={aoMudarLogo}
        aoMudarLogoCores={aoMudarLogoCores}
        aoMudarCorFundoHero={aoMudarCorFundoHero}
        aoMudarOpacidadeFundoHero={aoMudarOpacidadeFundoHero}
        aoMudarFundoHeroTipo={aoMudarFundoHeroTipo}
        aoMudarImagemFundoHeroDesktop={aoMudarImagemFundoHeroDesktop}
        aoMudarImagemFundoHeroMobile={aoMudarImagemFundoHeroMobile}
        aoMudarCorTextoHero={aoMudarCorTextoHero}
        aoMudarCorBuzioHero={aoMudarCorBuzioHero}
        aoMudarFaixaHeroTipoDesktop={aoMudarFaixaHeroTipoDesktop}
        aoMudarCorFaixaHeroDesktop={aoMudarCorFaixaHeroDesktop}
        aoMudarImagemFaixaHeroDesktop={aoMudarImagemFaixaHeroDesktop}
        aoMudarFaixaHeroTipoMobile={aoMudarFaixaHeroTipoMobile}
        aoMudarCorFaixaHeroMobile={aoMudarCorFaixaHeroMobile}
        aoMudarImagemFaixaHeroMobile={aoMudarImagemFaixaHeroMobile}
      />
      <SecaoRealizadores
        realizadores={realizadores}
        corFundo={corFundoRealizadores}
        erros={erros}
        aoMudarRealizador={aoMudarRealizador}
        aoMudarCorFundo={aoMudarCorFundo}
        aoSalvar={() => salvar({})}
        aoAdicionarRealizador={aoAdicionarRealizador}
        aoRemoverRealizador={aoRemoverRealizador}
      />
    </div>
  );
}
