import Divisor from "@/components/graficos/Divisor";
import FormularioValidarCertificado from "@/components/publico/FormularioValidarCertificado";
import { buscarCertificadoPublico } from "@/lib/publico";
import { normalizarCodigoCertificado } from "@/lib/certificados";
import styles from "../page.module.scss";

export const metadata = { title: "Validar certificado", robots: { index: false } };

function formatarData(valor) {
  return new Date(valor).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
}

export default async function PaginaResultadoValidacao({ params }) {
  const codigo = normalizarCodigoCertificado(decodeURIComponent(params.codigo));
  const certificado = await buscarCertificadoPublico(codigo);
  const valido = certificado?.situacao === "VALIDO";

  return (
    <article className={styles.pagina}>
      <header className={styles.cabecalho}>
        <span className={styles.eyebrow}>Certificados</span>
        <h1 className={`${styles.titulo} stencil`}>Validar certificado</h1>
      </header>

      <Divisor className={styles.divisor} />

      {!certificado ? (
        <section className={styles.resultado} aria-live="polite">
          <h2 className={styles.situacao}>Certificado não encontrado</h2>
          <p className={styles.texto}>
            Não encontramos certificado com o código <strong>{codigo || params.codigo}</strong>. Confira se digitou o
            código exatamente como aparece no certificado.
          </p>
        </section>
      ) : (
        <section className={`${styles.resultado} ${valido ? styles.valido : styles.revogado}`} aria-live="polite">
          <h2 className={styles.situacao}>{valido ? "Certificado válido" : "Certificado revogado"}</h2>
          <p className={styles.texto}>
            {valido
              ? "Este certificado foi emitido pela organização do evento e é autêntico."
              : `Este certificado foi emitido, mas revogado pela organização${
                  certificado.revogadoEm ? ` em ${formatarData(certificado.revogadoEm)}` : ""
                } e não tem mais validade.`}
          </p>
          <dl className={styles.dados}>
            <div>
              <dt>Nome</dt>
              <dd>{certificado.nome}</dd>
            </div>
            <div>
              <dt>Certificado</dt>
              <dd>{certificado.rotuloTipo}</dd>
            </div>
            {certificado.referencia && (
              <div>
                <dt>{certificado.tipo === "APRESENTACAO_TRABALHO" ? "Trabalho" : "Atividade"}</dt>
                <dd>{certificado.referencia}</dd>
              </div>
            )}
            <div>
              <dt>Evento</dt>
              <dd>{certificado.edicao}</dd>
            </div>
            {certificado.cargaHoraria != null && (
              <div>
                <dt>Carga horária</dt>
                <dd>{certificado.cargaHoraria} horas</dd>
              </div>
            )}
            <div>
              <dt>Emitido em</dt>
              <dd>{formatarData(certificado.emitidoEm)}</dd>
            </div>
            <div>
              <dt>Código</dt>
              <dd>{certificado.codigo}</dd>
            </div>
          </dl>
        </section>
      )}

      <section className={styles.outroCodigo} aria-labelledby="validar-outro">
        <h2 id="validar-outro" className={styles.tituloOutro}>
          Validar outro código
        </h2>
        <FormularioValidarCertificado />
      </section>
    </article>
  );
}
