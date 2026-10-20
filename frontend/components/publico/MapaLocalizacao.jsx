"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { rotuloLinkPonto, urlComoChegar } from "@/lib/localizacao";
import styles from "./MapaLocalizacao.module.scss";

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
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Conteúdo do InfoWindow injetado como HTML cru (fora da árvore React) —
// desenhado pra lembrar o cartão nativo que o Google mostra ao clicar num
// ponto de interesse já indicado por padrão no mapa (imagem no topo, nome,
// descrição e endereço abaixo, ações no rodapé). Estilo sempre inline
// porque uma classe do CSS Module não é garantida a se aplicar aqui.
function montarConteudoPonto(ponto) {
  const corTipo = ponto.tipo.cor;
  const rotuloTipo = escaparHtml(ponto.grupo ? `${ponto.tipo.nome} · ${ponto.grupo}` : ponto.tipo.nome);
  const nome = escaparHtml(ponto.nome);
  const descricao = ponto.descricao ? escaparHtml(ponto.descricao) : "";
  const endereco = ponto.endereco ? escaparHtml(ponto.endereco) : "";

  const imagemHtml = ponto.imagem
    ? `<img src="${escaparHtml(ponto.imagem)}" alt="" style="display:block;width:100%;height:120px;object-fit:cover;border-radius:4px;margin-bottom:8px;" />`
    : "";

  const estiloAcao = "font-size:12px;font-weight:700;color:#9c4a2f;text-decoration:none;";
  const acoes = [
    ponto.link
      ? `<a href="${escaparHtml(ponto.link)}" target="_blank" rel="noopener noreferrer" style="${estiloAcao}">${escaparHtml(rotuloLinkPonto(ponto.link))} ↗</a>`
      : "",
    `<a href="${urlComoChegar(ponto)}" target="_blank" rel="noopener noreferrer" style="${estiloAcao}">Como chegar ↗</a>`,
  ].join("");

  return `
    <div style="width:220px;font-family:inherit;">
      ${imagemHtml}
      <div style="font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${corTipo};margin-bottom:2px;">${rotuloTipo}</div>
      <div style="font-weight:700;font-size:14px;color:#201914;line-height:1.3;">${nome}</div>
      ${descricao ? `<div style="font-size:12px;color:#4d4842;margin-top:4px;line-height:1.4;">${descricao}</div>` : ""}
      ${endereco ? `<div style="font-size:12px;color:#4d4842;margin-top:4px;line-height:1.35;">${endereco}</div>` : ""}
      ${ponto.aproximado ? `<div style="font-size:11px;font-style:italic;color:#4d4842;margin-top:4px;">Localização aproximada</div>` : ""}
      <div style="display:flex;gap:14px;margin-top:8px;padding-top:8px;border-top:1px solid #e5ded2;">${acoes}</div>
    </div>
  `;
}

// `idsVisiveis` (Set ou null = todos) filtra os marcadores sem recriar o
// mapa; `aoSelecionar(id)` avisa a lista quando um marcador é clicado.
const MapaLocalizacao = forwardRef(function MapaLocalizacao(
  { pontos = [], idsVisiveis = null, aoSelecionar },
  ref
) {
  const containerRef = useRef(null);
  const mapaInstanciaRef = useRef(null);
  const infoWindowRef = useRef(null);
  const registrosRef = useRef({});
  const aoSelecionarRef = useRef(aoSelecionar);
  const [pronto, setPronto] = useState(false);

  aoSelecionarRef.current = aoSelecionar;

  useImperativeHandle(ref, () => ({
    focarPonto(id) {
      const registro = registrosRef.current[id];
      if (!registro || !mapaInstanciaRef.current || !infoWindowRef.current) return;
      infoWindowRef.current.setContent(registro.conteudo);
      infoWindowRef.current.open({ map: mapaInstanciaRef.current, anchor: registro.marcador });
      mapaInstanciaRef.current.panTo(registro.marcador.getPosition());
      if (mapaInstanciaRef.current.getZoom() < 15) mapaInstanciaRef.current.setZoom(15);

      // No desktop o mapa fica fixo ao lado da lista; só rola a página
      // quando ele está fora da tela (celular, mapa acima da lista).
      const caixa = containerRef.current?.getBoundingClientRect();
      if (caixa && (caixa.top < 0 || caixa.bottom > window.innerHeight)) {
        containerRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
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

        for (const ponto of pontos) {
          const marcador = new google.maps.Marker({
            position: { lat: ponto.latitude, lng: ponto.longitude },
            map: mapa,
            title: ponto.nome,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: ponto.tipo.cor,
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
            aoSelecionarRef.current?.(ponto.id);
          });
        }

        setPronto(true);
      });

    return () => {
      cancelado = true;
      setPronto(false);
    };
  }, [pontos]);

  // Mostra só os marcadores do filtro atual e reenquadra o mapa neles.
  useEffect(() => {
    const mapa = mapaInstanciaRef.current;
    if (!pronto || !mapa) return;

    infoWindowRef.current?.close();
    const bounds = new google.maps.LatLngBounds();
    let visiveis = 0;

    for (const [id, { marcador }] of Object.entries(registrosRef.current)) {
      const visivel = !idsVisiveis || idsVisiveis.has(id);
      marcador.setVisible(visivel);
      if (visivel) {
        bounds.extend(marcador.getPosition());
        visiveis += 1;
      }
    }

    if (visiveis === 1) {
      mapa.setCenter(bounds.getCenter());
      mapa.setZoom(15);
    } else if (visiveis > 1) {
      mapa.fitBounds(bounds, 48);
    }
  }, [pronto, idsVisiveis]);

  if (pontos.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className={styles.mapa}
      role="region"
      aria-label="Mapa com os pontos de referência do evento"
    />
  );
});

export default MapaLocalizacao;
