import { Archivo, Allerta_Stencil } from "next/font/google";
import "@/styles/globals.scss";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  weight: ["400", "500", "600", "700", "800"],
});

const allertaStencil = Allerta_Stencil({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-stencil",
});

export const metadata = {
  title: "Narrativas — GPDES/UnB",
  description:
    "Narrativas Interculturais, Decoloniais e Antirracistas em Educação — GPDES/UnB",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${archivo.variable} ${allertaStencil.variable}`}>
      <body>{children}</body>
    </html>
  );
}
