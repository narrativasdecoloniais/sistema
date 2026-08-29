"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import styles from "./MapaLocalizacao.module.scss";

const CORES_POR_TIPO = {
  LOCAL_EVENTO: "#9c4a2f", // --barro
  HOSPEDAGEM: "#b87c34", // --ocre
  RESTAURANTE: "#55603f", // --cerrado
  OUTRO: "#201914", // --tinta
};

const ROTULOS_TIPO_PONTO = {
  LOCAL_EVENTO: "Local do evento",
  HOSPEDAGEM: "Hospedagem",
  RESTAURANTE: "Restaurante",
  OUTRO: "Outro",
};

// setOptions só pode ser chamado uma vez, antes de qualquer importLibrary
// (API funcional nova — a classe Loader foi removida a partir da v2).
let opcoesConfiguradas = false;

function garantirOpcoes() {
  if (!opcoesConfiguradas) {
    setOptions({ key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY, v: "weekly" });
    opcoesConfiguradas = true;
  }
}

function escaparHtml(texto) {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Conteúdo do InfoWindow injetado como HTML cru (fora da árvore React) —
// desenhado pra lembrar o cartão nativo que o Google mostra ao clicar num
// ponto de interesse já indicado por padrão no mapa (imagem no topo, botão
// circular de link no canto e nome/endereço abaixo). Estilo sempre inline
// porque uma classe do CSS Module não é garantida a se aplicar aqui.
function montarConteudoPonto(ponto) {
  const corTipo = CORES_POR_TIPO[ponto.tipo] || CORES_POR_TIPO.OUTRO;
  const rotuloTipo = ROTULOS_TIPO_PONTO[ponto.tipo] || ponto.tipo;
  const nome = escaparHtml(ponto.nome);
  const endereco = ponto.endereco ? escaparHtml(ponto.endereco) : "";

  const botaoLink = ponto.link
    ? `<a href="${ponto.link}" target="_blank" rel="noopener noreferrer" title="Abrir link" style="position:absolute;top:6px;right:6px;width:26px;height:26px;border-radius:50%;background:#faf6ee;box-shadow:0 1px 4px rgba(32,25,20,0.35);display:flex;align-items:center;justify-content:center;text-decoration:none;">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#201914" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      </a>`
    : "";

  const imagemHtml = ponto.imagem
    ? `<img src="${ponto.imagem}" alt="" style="display:block;width:100%;height:120px;object-fit:cover;border-radius:8px;" />`
    : "";

  const urlMaps = `https://www.google.com/maps/search/?api=1&query=${ponto.latitude}%2C${ponto.longitude}`;
  const botaoMaps = `
    <a href="${urlMaps}" target="_blank" rel="noopener noreferrer" style="display:flex;align-items:center;gap:6px;margin-top:8px;padding-top:8px;border-top:1px solid #e5ded2;font-size:12px;font-weight:700;color:#201914;text-decoration:none;">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      Abrir no Maps
    </a>
  `;

  return `
    <div style="position:relative;width:200px;font-family:inherit;">
      ${botaoLink}
      ${imagemHtml}
      <div style="padding:${imagemHtml ? "8px" : "4px"} ${ponto.link && !imagemHtml ? "32px" : "2px"} 2px 2px;">
        <div style="font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${corTipo};margin-bottom:2px;">${rotuloTipo}</div>
        <div style="font-weight:700;font-size:14px;color:#201914;line-height:1.3;">${nome}</div>
        ${endereco ? `<div style="font-size:12px;color:#6b6258;margin-top:3px;line-height:1.35;">${endereco}</div>` : ""}
        ${botaoMaps}
      </div>
    </div>
  `;
}

const MapaLocalizacao = forwardRef(function MapaLocalizacao({ pontos = [] }, ref) {
  const containerRef = useRef(null);
  const mapaInstanciaRef = useRef(null);
  const infoWindowRef = useRef(null);
  const registrosRef = useRef({});

  useImperativeHandle(ref, () => ({
    focarPonto(id) {
      const registro = registrosRef.current[id];
      if (!registro || !mapaInstanciaRef.current || !infoWindowRef.current) return;
      infoWindowRef.current.setContent(registro.conteudo);
      infoWindowRef.current.open({ map: mapaInstanciaRef.current, anchor: registro.marcador });
      mapaInstanciaRef.current.panTo(registro.marcador.getPosition());
      containerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    },
  }), []);

  useEffect(() => {
    if (!containerRef.current || pontos.length === 0) return;
    let cancelado = false;

    garantirOpcoes();
    Promise.all([importLibrary("maps"), importLibrary("marker")])
      .then(([{ Map, InfoWindow }]) => {
        if (cancelado || !containerRef.current) return;

        const mapa = new Map(containerRef.current, {
          center: { lat: pontos[0].latitude, lng: pontos[0].longitude },
          zoom: 15,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        const infoWindow = new InfoWindow();
        mapaInstanciaRef.current = mapa;
        infoWindowRef.current = infoWindow;
        registrosRef.current = {};

        const bounds = new google.maps.LatLngBounds();

        for (const ponto of pontos) {
          const posicao = { lat: ponto.latitude, lng: ponto.longitude };
          bounds.extend(posicao);

          const marcador = new google.maps.Marker({
            position: posicao,
            map: mapa,
            title: ponto.nome,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: CORES_POR_TIPO[ponto.tipo] || CORES_POR_TIPO.OUTRO,
              fillOpacity: 1,
              strokeColor: "#faf6ee",
              strokeWeight: 2,
            },
          });

          const conteudo = montarConteudoPonto(ponto);
          registrosRef.current[ponto.id] = { marcador, conteudo };

          marcador.addListener("click", () => {
            infoWindow.setContent(conteudo);
            infoWindow.open({ map: mapa, anchor: marcador });
          });
        }

        if (pontos.length === 1) {
          mapa.setCenter(bounds.getCenter());
          mapa.setZoom(15);
        } else {
          mapa.fitBounds(bounds);
        }
      });

    return () => {
      cancelado = true;
    };
  }, [pontos]);

  if (pontos.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className={styles.mapa}
      role="img"
      aria-label="Mapa com os pontos de interesse do evento"
    />
  );
});

export default MapaLocalizacao;
