"use client";

import { useEffect, useState } from "react";
import CampoLogo from "../CampoLogo";
import { avisosImagemAnais } from "@/lib/anais";
import estilos from "./AnaisPainel.module.scss";

const TAMANHO_MAX_ARQUIVO = 20 * 1024 * 1024;

// Capa, modelo de página ou faixa de cabeçalho/rodapé dos Anais: o arquivo (data URI novo ou
// URL já salva), a orientação de tamanho e os avisos não bloqueantes sobre a
// imagem escolhida (proporção/resolução, medidas lidas no navegador).
export default function CampoImagemAnais({ id, rotulo, tipo, valor, onChange, dimensaoMax, orientacao, erro }) {
  const [dimensoes, setDimensoes] = useState(null);

  useEffect(() => {
    setDimensoes(null);
    if (!valor) return undefined;
    let ativo = true;
    const imagem = new Image();
    imagem.onload = () => {
      if (ativo) setDimensoes({ largura: imagem.naturalWidth, altura: imagem.naturalHeight });
    };
    imagem.src = valor;
    return () => {
      ativo = false;
    };
  }, [valor]);

  const avisos = valor ? avisosImagemAnais(tipo, dimensoes) : [];

  return (
    <div className={estilos.campoImagem}>
      <CampoLogo
        id={id}
        rotulo={rotulo}
        valor={valor}
        onChange={onChange}
        erro={erro}
        dimensaoMax={dimensaoMax}
        tamanhoMaxArquivo={TAMANHO_MAX_ARQUIVO}
        textoItem="imagem"
        // Capa e modelo ocupam a página inteira — JPEG (transparência vira o
        // branco do papel) deixa o envio bem mais leve. As faixas mantêm a
        // transparência do PNG.
        forcarJpeg={tipo === "capa" || tipo === "pagina"}
      />
      <p className={estilos.orientacaoImagem}>{orientacao}</p>
      {dimensoes && avisos.length === 0 && (
        <p className={estilos.orientacaoImagem}>
          Imagem: {dimensoes.largura} × {dimensoes.altura} px — tamanho adequado.
        </p>
      )}
      {avisos.map((aviso) => (
        <p key={aviso} className={estilos.aviso} role="status">
          {aviso}
        </p>
      ))}
    </div>
  );
}
