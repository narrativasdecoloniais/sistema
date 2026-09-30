import Divisor from "@/components/graficos/Divisor";
import FormularioValidarCertificado from "@/components/publico/FormularioValidarCertificado";
import styles from "./page.module.scss";

export const metadata = { title: "Validar certificado" };

export default function PaginaValidarCertificado() {
  return (
    <article className={styles.pagina}>
      <header className={styles.cabecalho}>
        <span className={styles.eyebrow}>Certificados</span>
        <h1 className={`${styles.titulo} stencil`}>Validar certificado</h1>
        <p className={styles.subtitulo}>
          Confira a autenticidade de um certificado emitido pelo evento. Leia o QR code impresso nele ou digite o código
          que aparece embaixo do QR.
        </p>
      </header>

      <Divisor className={styles.divisor} />

      <FormularioValidarCertificado />
    </article>
  );
}
