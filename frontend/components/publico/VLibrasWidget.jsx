"use client";

import Script from "next/script";

// Widget oficial do governo federal (vlibras.gov.br) — traduz o conteúdo da
// página para Libras. Renderizado uma única vez pelo layout público
// ((publico)/layout.jsx), ao lado de BotaoContatoFlutuante: os dois ficam no
// canto inferior direito, o VLibras na posição padrão dele (encostado no
// canto) e o botão de contato deslocado pra cima, ver
// BotaoContatoFlutuante.module.scss.
export default function VLibrasWidget() {
  return (
    <>
      <div vw="" className="enabled">
        <div vw-access-button="" className="active" />
        <div vw-plugin-wrapper="">
          <div className="vw-plugin-top-wrapper" />
        </div>
      </div>
      <Script
        src="https://vlibras.gov.br/app/vlibras-plugin.js"
        strategy="afterInteractive"
        onLoad={() => new window.VLibras.Widget("https://vlibras.gov.br/app")}
      />
    </>
  );
}
