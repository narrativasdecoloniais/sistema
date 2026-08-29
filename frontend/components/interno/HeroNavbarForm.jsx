"use client";

import { useState } from "react";
import { z } from "zod";
import { useToast } from "./ToastProvider";
import { apiClient } from "@/lib/apiClient";
import { extrairErros } from "@/lib/validacao";
import { corSchema } from "@/lib/cores";
import SecaoHero from "./SecaoHero";
import SecaoNavegacao from "./SecaoNavegacao";
import styles from "./EdicaoForm.module.scss";

const TIPO_FAIXA = ["COR", "IMAGEM", "NENHUMA"];
const TIPO_FUNDO = ["COR", "IMAGEM"];
const TIPO_FUNDO_NAV = ["TRANSPARENTE", "COR"];

const heroNavbarSchema = z.object({
  logoSvg: z.string().max(300_000).nullable().optional(),
  logoSvgCores: z.record(z.string(), z.string()).nullable().optional(),
  corFundoHero: corSchema,
  opacidadeFundoHero: z.number().int().min(0).max(100).optional(),
  fundoHeroTipo: z.enum(TIPO_FUNDO).optional(),
  imagemFundoHeroDesktop: z.string().max(20_000_000).nullable().optional(),
  imagemFundoHeroMobile: z.string().max(20_000_000).nullable().optional(),
  corTextoHero: corSchema,
  corBuzioHero: corSchema,
  faixaHeroTipoDesktop: z.enum(TIPO_FAIXA).optional(),
  corFaixaHeroDesktop: corSchema,
  imagemFaixaHeroDesktop: z.string().max(8_000_000).nullable().optional(),
  larguraFaixaHeroDesktop: z.number().int().positive().optional(),
  faixaHeroTipoMobile: z.enum(TIPO_FAIXA).optional(),
  corFaixaHeroMobile: corSchema,
  imagemFaixaHeroMobile: z.string().max(8_000_000).nullable().optional(),
  larguraFaixaHeroMobile: z.number().int().positive().optional(),
  mostrarFaixaHero: z.boolean().optional(),
  fundoNavTopoTipo: z.enum(TIPO_FUNDO_NAV).optional(),
  corFundoNavTopo: corSchema,
  corTextoNavTopo: corSchema,
  corIconeNavTopo: corSchema,
  corBordaNavTopo: corSchema,
  corFundoNavRolado: corSchema,
  corTextoNavRolado: corSchema,
  corIconeNavRolado: corSchema,
  corBordaNavRolado: corSchema,
  navMesmoEstilo: z.boolean().optional(),
  corFundoBotaoNav: corSchema,
  corTextoBotaoNav: corSchema,
});

export default function HeroNavbarForm({ edicaoInicial }) {
  const { notificar } = useToast();
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
  const [larguraFaixaHeroDesktop, setLarguraFaixaHeroDesktop] = useState(
    edicaoInicial.larguraFaixaHeroDesktop ?? 96
  );
  const [faixaHeroTipoMobile, setFaixaHeroTipoMobile] = useState(edicaoInicial.faixaHeroTipoMobile || "COR");
  const [corFaixaHeroMobile, setCorFaixaHeroMobile] = useState(edicaoInicial.corFaixaHeroMobile || "OCRE");
  const [imagemFaixaHeroMobile, setImagemFaixaHeroMobile] = useState(edicaoInicial.imagemFaixaHeroMobile || null);
  const [larguraFaixaHeroMobile, setLarguraFaixaHeroMobile] = useState(
    edicaoInicial.larguraFaixaHeroMobile ?? 40
  );
  const [mostrarFaixaHero, setMostrarFaixaHero] = useState(edicaoInicial.mostrarFaixaHero ?? true);
  const [fundoNavTopoTipo, setFundoNavTopoTipo] = useState(edicaoInicial.fundoNavTopoTipo || "TRANSPARENTE");
  const [corFundoNavTopo, setCorFundoNavTopo] = useState(edicaoInicial.corFundoNavTopo || "PAPEL");
  const [corTextoNavTopo, setCorTextoNavTopo] = useState(edicaoInicial.corTextoNavTopo || "TINTA");
  const [corIconeNavTopo, setCorIconeNavTopo] = useState(edicaoInicial.corIconeNavTopo || "TINTA");
  const [corBordaNavTopo, setCorBordaNavTopo] = useState(edicaoInicial.corBordaNavTopo || "TINTA");
  const [corFundoNavRolado, setCorFundoNavRolado] = useState(edicaoInicial.corFundoNavRolado || "CERRADO");
  const [corTextoNavRolado, setCorTextoNavRolado] = useState(edicaoInicial.corTextoNavRolado || "PAPEL");
  const [corIconeNavRolado, setCorIconeNavRolado] = useState(edicaoInicial.corIconeNavRolado || "BUZIO");
  const [corBordaNavRolado, setCorBordaNavRolado] = useState(edicaoInicial.corBordaNavRolado || "BUZIO");
  const [navMesmoEstilo, setNavMesmoEstilo] = useState(edicaoInicial.navMesmoEstilo || false);
  const [corFundoBotaoNav, setCorFundoBotaoNav] = useState(edicaoInicial.corFundoBotaoNav || "BARRO");
  const [corTextoBotaoNav, setCorTextoBotaoNav] = useState(edicaoInicial.corTextoBotaoNav || "PAPEL");
  const [erros, setErros] = useState({});

  async function salvar(overrides = {}) {
    const resultado = heroNavbarSchema.safeParse({
      logoSvg: overrides.logoSvg,
      logoSvgCores: overrides.logoSvgCores,
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
      larguraFaixaHeroDesktop: overrides.larguraFaixaHeroDesktop ?? larguraFaixaHeroDesktop,
      faixaHeroTipoMobile: overrides.faixaHeroTipoMobile ?? faixaHeroTipoMobile,
      corFaixaHeroMobile: overrides.corFaixaHeroMobile ?? corFaixaHeroMobile,
      imagemFaixaHeroMobile: overrides.imagemFaixaHeroMobile,
      larguraFaixaHeroMobile: overrides.larguraFaixaHeroMobile ?? larguraFaixaHeroMobile,
      mostrarFaixaHero: overrides.mostrarFaixaHero ?? mostrarFaixaHero,
      fundoNavTopoTipo: overrides.fundoNavTopoTipo ?? fundoNavTopoTipo,
      corFundoNavTopo: overrides.corFundoNavTopo ?? corFundoNavTopo,
      corTextoNavTopo: overrides.corTextoNavTopo ?? corTextoNavTopo,
      corIconeNavTopo: overrides.corIconeNavTopo ?? corIconeNavTopo,
      corBordaNavTopo: overrides.corBordaNavTopo ?? corBordaNavTopo,
      corFundoNavRolado: overrides.corFundoNavRolado ?? corFundoNavRolado,
      corTextoNavRolado: overrides.corTextoNavRolado ?? corTextoNavRolado,
      corIconeNavRolado: overrides.corIconeNavRolado ?? corIconeNavRolado,
      corBordaNavRolado: overrides.corBordaNavRolado ?? corBordaNavRolado,
      navMesmoEstilo: overrides.navMesmoEstilo ?? navMesmoEstilo,
      corFundoBotaoNav: overrides.corFundoBotaoNav ?? corFundoBotaoNav,
      corTextoBotaoNav: overrides.corTextoBotaoNav ?? corTextoBotaoNav,
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
        corFundoHero: resultado.data.corFundoHero,
        opacidadeFundoHero: resultado.data.opacidadeFundoHero,
        fundoHeroTipo: resultado.data.fundoHeroTipo,
        corTextoHero: resultado.data.corTextoHero,
        corBuzioHero: resultado.data.corBuzioHero,
        faixaHeroTipoDesktop: resultado.data.faixaHeroTipoDesktop,
        corFaixaHeroDesktop: resultado.data.corFaixaHeroDesktop,
        larguraFaixaHeroDesktop: resultado.data.larguraFaixaHeroDesktop,
        faixaHeroTipoMobile: resultado.data.faixaHeroTipoMobile,
        corFaixaHeroMobile: resultado.data.corFaixaHeroMobile,
        larguraFaixaHeroMobile: resultado.data.larguraFaixaHeroMobile,
        mostrarFaixaHero: resultado.data.mostrarFaixaHero,
        fundoNavTopoTipo: resultado.data.fundoNavTopoTipo,
        corFundoNavTopo: resultado.data.corFundoNavTopo,
        corTextoNavTopo: resultado.data.corTextoNavTopo,
        corIconeNavTopo: resultado.data.corIconeNavTopo,
        corBordaNavTopo: resultado.data.corBordaNavTopo,
        corFundoNavRolado: resultado.data.corFundoNavRolado,
        corTextoNavRolado: resultado.data.corTextoNavRolado,
        corIconeNavRolado: resultado.data.corIconeNavRolado,
        corBordaNavRolado: resultado.data.corBordaNavRolado,
        navMesmoEstilo: resultado.data.navMesmoEstilo,
        corFundoBotaoNav: resultado.data.corFundoBotaoNav,
        corTextoBotaoNav: resultado.data.corTextoBotaoNav,
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
      setLarguraFaixaHeroDesktop(resposta.edicao.larguraFaixaHeroDesktop);
      setFaixaHeroTipoMobile(resposta.edicao.faixaHeroTipoMobile);
      setCorFaixaHeroMobile(resposta.edicao.corFaixaHeroMobile);
      setImagemFaixaHeroMobile(resposta.edicao.imagemFaixaHeroMobile || null);
      setLarguraFaixaHeroMobile(resposta.edicao.larguraFaixaHeroMobile);
      setMostrarFaixaHero(resposta.edicao.mostrarFaixaHero);
      setFundoNavTopoTipo(resposta.edicao.fundoNavTopoTipo);
      setCorFundoNavTopo(resposta.edicao.corFundoNavTopo);
      setCorTextoNavTopo(resposta.edicao.corTextoNavTopo);
      setCorIconeNavTopo(resposta.edicao.corIconeNavTopo);
      setCorBordaNavTopo(resposta.edicao.corBordaNavTopo);
      setCorFundoNavRolado(resposta.edicao.corFundoNavRolado);
      setCorTextoNavRolado(resposta.edicao.corTextoNavRolado);
      setCorIconeNavRolado(resposta.edicao.corIconeNavRolado);
      setCorBordaNavRolado(resposta.edicao.corBordaNavRolado);
      setNavMesmoEstilo(resposta.edicao.navMesmoEstilo);
      setCorFundoBotaoNav(resposta.edicao.corFundoBotaoNav);
      setCorTextoBotaoNav(resposta.edicao.corTextoBotaoNav);
      notificar("Página do evento atualizada com sucesso.");
    } catch (erro) {
      notificar(erro.message, "erro");
    }
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

  function aoMudarLarguraFaixaHeroDesktop(valor) {
    setLarguraFaixaHeroDesktop(valor);
    salvar({ larguraFaixaHeroDesktop: valor });
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

  function aoMudarLarguraFaixaHeroMobile(valor) {
    setLarguraFaixaHeroMobile(valor);
    salvar({ larguraFaixaHeroMobile: valor });
  }

  function aoMudarMostrarFaixaHero(valor) {
    setMostrarFaixaHero(valor);
    salvar({ mostrarFaixaHero: valor });
  }

  function aoMudarFundoNavTopoTipo(valor) {
    setFundoNavTopoTipo(valor);
    salvar({ fundoNavTopoTipo: valor });
  }

  function aoMudarCorFundoNavTopo(valor) {
    setCorFundoNavTopo(valor);
    salvar({ corFundoNavTopo: valor });
  }

  function aoMudarCorTextoNavTopo(valor) {
    setCorTextoNavTopo(valor);
    salvar({ corTextoNavTopo: valor });
  }

  function aoMudarCorIconeNavTopo(valor) {
    setCorIconeNavTopo(valor);
    salvar({ corIconeNavTopo: valor });
  }

  function aoMudarCorBordaNavTopo(valor) {
    setCorBordaNavTopo(valor);
    salvar({ corBordaNavTopo: valor });
  }

  function aoMudarCorFundoNavRolado(valor) {
    setCorFundoNavRolado(valor);
    salvar({ corFundoNavRolado: valor });
  }

  function aoMudarCorTextoNavRolado(valor) {
    setCorTextoNavRolado(valor);
    salvar({ corTextoNavRolado: valor });
  }

  function aoMudarCorIconeNavRolado(valor) {
    setCorIconeNavRolado(valor);
    salvar({ corIconeNavRolado: valor });
  }

  function aoMudarCorBordaNavRolado(valor) {
    setCorBordaNavRolado(valor);
    salvar({ corBordaNavRolado: valor });
  }

  function aoMudarNavMesmoEstilo(valor) {
    setNavMesmoEstilo(valor);
    salvar({ navMesmoEstilo: valor });
  }

  function aoMudarCorFundoBotaoNav(valor) {
    setCorFundoBotaoNav(valor);
    salvar({ corFundoBotaoNav: valor });
  }

  function aoMudarCorTextoBotaoNav(valor) {
    setCorTextoBotaoNav(valor);
    salvar({ corTextoBotaoNav: valor });
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
        larguraFaixaHeroDesktop={larguraFaixaHeroDesktop}
        faixaHeroTipoMobile={faixaHeroTipoMobile}
        corFaixaHeroMobile={corFaixaHeroMobile}
        imagemFaixaHeroMobile={imagemFaixaHeroMobile}
        larguraFaixaHeroMobile={larguraFaixaHeroMobile}
        mostrarFaixaHero={mostrarFaixaHero}
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
        aoMudarLarguraFaixaHeroDesktop={aoMudarLarguraFaixaHeroDesktop}
        aoMudarFaixaHeroTipoMobile={aoMudarFaixaHeroTipoMobile}
        aoMudarCorFaixaHeroMobile={aoMudarCorFaixaHeroMobile}
        aoMudarImagemFaixaHeroMobile={aoMudarImagemFaixaHeroMobile}
        aoMudarLarguraFaixaHeroMobile={aoMudarLarguraFaixaHeroMobile}
        aoMudarMostrarFaixaHero={aoMudarMostrarFaixaHero}
      />
      <SecaoNavegacao
        fundoNavTopoTipo={fundoNavTopoTipo}
        corFundoNavTopo={corFundoNavTopo}
        corTextoNavTopo={corTextoNavTopo}
        corIconeNavTopo={corIconeNavTopo}
        corBordaNavTopo={corBordaNavTopo}
        corFundoNavRolado={corFundoNavRolado}
        corTextoNavRolado={corTextoNavRolado}
        corIconeNavRolado={corIconeNavRolado}
        corBordaNavRolado={corBordaNavRolado}
        navMesmoEstilo={navMesmoEstilo}
        corFundoBotaoNav={corFundoBotaoNav}
        corTextoBotaoNav={corTextoBotaoNav}
        aoMudarFundoNavTopoTipo={aoMudarFundoNavTopoTipo}
        aoMudarCorFundoNavTopo={aoMudarCorFundoNavTopo}
        aoMudarCorTextoNavTopo={aoMudarCorTextoNavTopo}
        aoMudarCorIconeNavTopo={aoMudarCorIconeNavTopo}
        aoMudarCorBordaNavTopo={aoMudarCorBordaNavTopo}
        aoMudarCorFundoNavRolado={aoMudarCorFundoNavRolado}
        aoMudarCorTextoNavRolado={aoMudarCorTextoNavRolado}
        aoMudarCorIconeNavRolado={aoMudarCorIconeNavRolado}
        aoMudarCorBordaNavRolado={aoMudarCorBordaNavRolado}
        aoMudarNavMesmoEstilo={aoMudarNavMesmoEstilo}
        aoMudarCorFundoBotaoNav={aoMudarCorFundoBotaoNav}
        aoMudarCorTextoBotaoNav={aoMudarCorTextoBotaoNav}
      />
    </div>
  );
}
