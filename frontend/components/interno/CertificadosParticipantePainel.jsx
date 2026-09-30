"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import Botao from "@/components/forms/Botao";
import { useToast } from "./ToastProvider";
import { paraNumeroRomano } from "@/lib/romanos";
import { certificadosParticipante } from "@/lib/certificados";
import styles from "./SubmissoesParticipantePainel.module.scss";
import estilos from "./CertificadosParticipantePainel.module.scss";

function agruparPorEdicao(certificados) {
  const grupos = new Map();
  for (const certificado of certificados) {
    if (!grupos.has(certificado.edicao.id)) grupos.set(certificado.edicao.id, { edicao: certificado.edicao, itens: [] });
    grupos.get(certificado.edicao.id).itens.push(certificado);
  }
  return [...grupos.values()];
}

// Certificados liberados pela organização (backend: listarDoParticipante),
// agrupados por edição, com download do PDF.
export default function CertificadosParticipantePainel() {
  const { notificar } = useToast();
  const [certificados, setCertificados] = useState(null);
  const [erro, setErro] = useState(false);
  const [baixandoId, setBaixandoId] = useState(null);

  useEffect(() => {
    let cancelado = false;
    certificadosParticipante
      .listar()
      .then((dados) => {
        if (!cancelado) setCertificados(dados.certificados);
      })
      .catch(() => {
        if (!cancelado) setErro(true);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  async function baixar(certificado) {
    setBaixandoId(certificado.id);
    try {
      await certificadosParticipante.baixar(certificado);
    } catch (falha) {
      notificar(falha.message, "erro");
    } finally {
      setBaixandoId(null);
    }
  }

  return (
    <div className={styles.pagina}>
      <div className={styles.cabecalho}>
        <div>
          <h1 className={styles.titulo}>Certificados</h1>
          <p className={styles.descricao}>
            Seus certificados liberados pela organização. Cada um tem um QR code e um código que qualquer pessoa pode
            conferir na página de validação.
          </p>
        </div>
      </div>

      {erro ? (
        <div className={styles.vazio}>
          <p>Não foi possível carregar seus certificados.</p>
          <p className={styles.vazioApoio}>Recarregue a página para tentar de novo.</p>
        </div>
      ) : certificados === null ? (
        <div className={styles.vazio}>
          <p>Carregando...</p>
        </div>
      ) : certificados.length === 0 ? (
        <div className={styles.vazio}>
          <p>Nenhum certificado disponível ainda.</p>
          <p className={styles.vazioApoio}>
            Os certificados aparecem aqui quando a organização os libera, depois do evento.
          </p>
        </div>
      ) : (
        agruparPorEdicao(certificados).map(({ edicao, itens }) => (
          <section key={edicao.id} className={estilos.grupo} aria-labelledby={`certificados-${edicao.id}`}>
            <h2 id={`certificados-${edicao.id}`} className={estilos.tituloGrupo}>
              {paraNumeroRomano(edicao.numero)} edição · {edicao.nome}
            </h2>
            <div className={styles.grade}>
              {itens.map((certificado) => (
                <article key={certificado.id} className={styles.cartao}>
                  <h3 className={styles.cartaoTitulo}>{certificado.rotuloTipo}</h3>
                  {certificado.referencia && <p className={styles.cartaoAutores}>{certificado.referencia}</p>}
                  {certificado.cargaHoraria != null && (
                    <p className={styles.cartaoMeta}>Carga horária: {certificado.cargaHoraria} h</p>
                  )}
                  <p className={styles.cartaoMeta}>
                    Código: <code>{certificado.codigo}</code>
                  </p>
                  <div className={estilos.acoes}>
                    <Botao
                      type="button"
                      variante="secundario"
                      carregando={baixandoId === certificado.id}
                      onClick={() => baixar(certificado)}
                      aria-label={`Baixar PDF do certificado de ${certificado.rotuloTipo.toLowerCase()}${
                        certificado.referencia ? ` — ${certificado.referencia}` : ""
                      }`}
                    >
                      <Download size={18} strokeWidth={1.5} aria-hidden="true" />
                      Baixar PDF
                    </Botao>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
