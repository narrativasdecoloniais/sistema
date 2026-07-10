import { Archivo, Saira_Stencil_One } from "next/font/google";
import "@/styles/globals.scss";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  weight: ["400", "500", "600", "700", "800"],
});

// Escolhida sobre a Allerta Stencil após comparação visual contra a logo
// oficial: traço grosso e corte geométrico ecoam o peso da logo, a Allerta
// é fina demais. Ambas foram verificadas (glifo + render) para ç/ã/õ/á/é.
const sairaStencilOne = Saira_Stencil_One({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  display: "swap",
  variable: "--font-stencil",
});

export const metadata = {
  title: "Narrativas — GPDES/UnB",
  description:
    "Narrativas Interculturais, Decoloniais e Antirracistas em Educação — GPDES/UnB",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${archivo.variable} ${sairaStencilOne.variable}`}>
      <body>{children}</body>
    </html>
  );
}
