import LeituraCredenciamento from "@/components/interno/LeituraCredenciamento";

// Destino do QR code (a câmera nativa do celular abre esta URL; sem sessão, o
// middleware passa pelo login e volta pra cá com ?destino=).
export default function PaginaLeituraCredenciamento({ params }) {
  return <LeituraCredenciamento token={params.token} />;
}
