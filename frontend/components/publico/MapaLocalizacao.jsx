"use client";

import { useEffect, useRef } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import styles from "./MapaLocalizacao.module.scss";

const CORES_POR_TIPO = {
  LOCAL_EVENTO: "#9c4a2f", // --barro
  HOSPEDAGEM: "#b87c34", // --ocre
  RESTAURANTE: "#55603f", // --cerrado
  OUTRO: "#201914", // --tinta
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

export default function MapaLocalizacao({ pontos = [] }) {
  const containerRef = useRef(null);

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

          const linhas = [`<strong>${ponto.nome}</strong>`];
          if (ponto.endereco) linhas.push(ponto.endereco);
          if (ponto.link) {
            linhas.push(
              `<a href="${ponto.link}" target="_blank" rel="noopener noreferrer">Ver mais</a>`
            );
          }

          marcador.addListener("click", () => {
            infoWindow.setContent(linhas.join("<br/>"));
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
}
