"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CardAjudaInscricao from "./CardAjudaInscricao";
import LeitorQrCode from "./LeitorQrCode";
import { formatarPeriodoAtividade } from "@/lib/publico";
import { buscarMinhaSituacaoCredenciamento, extrairTokenDoQr } from "@/lib/credenciamento";
import styles from "./CredenciamentoParticipante.module.scss";

function formatarDataHora(valor) {
  return new Date(valor).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

// Autocredenciamento: a pessoa lê o QR code do evento (credenciamento geral)
// ou de uma atividade (presença) pela câmera; a leitura leva a
// /participante/credenciamento/<token>, que faz o resto (LeituraCredenciamento).
export default function CredenciamentoParticipantePainel() {
  const router = useRouter();
  const [situacao, setSituacao] = useState(null);
  const [erroLeitura, setErroLeitura] = useState("");

  useEffect(() => {
    buscarMinhaSituacaoCredenciamento()
      .then(setSituacao)
      .catch(() => setSituacao({ erro: true }));
  }, []);

  function aoLer(texto) {
    const token = extrairTokenDoQr(texto);
    if (!token) {
      setErroLeitura("Este QR code não é do credenciamento do Narrativas.");
      return;
    }
    setErroLeitura("");
    router.push(`/participante/credenciamento/${token}`);
  }

  return (
    <div className={styles.pagina}>
      <CardAjudaInscricao />

      <div>
        <h1 className={styles.titulo}>Credenciamento</h1>
        <p className={styles.descricao}>
          Leia o QR code do credenciamento, na entrada do evento, ou o QR code afixado em cada atividade para
          registrar a sua presença.
        </p>
      </div>

      <section className={styles.cartao} aria-labelledby="ler-qr">
        <h2 id="ler-qr" className={styles.subtitulo}>
          Ler QR code
        </h2>
        <LeitorQrCode aoLer={aoLer} />
        {erroLeitura && (
          <p className={styles.aviso} role="alert">
            {erroLeitura}
          </p>
        )}
      </section>

      {situacao && !situacao.erro && (
        <section className={styles.cartao} aria-labelledby="minha-situacao">
          <h2 id="minha-situacao" className={styles.subtitulo}>
            Sua situação — {situacao.edicao.nome}
          </h2>
          <p className={styles.texto}>
            {situacao.credenciadoEm
              ? `Credenciado(a) no evento em ${formatarDataHora(situacao.credenciadoEm)}.`
              : "Você ainda não foi credenciado(a) no evento."}
          </p>
          {situacao.presencas.length > 0 ? (
            <ul className={styles.lista}>
              {situacao.presencas.map((presenca) => (
                <li key={presenca.id}>
                  <strong>{presenca.nome}</strong>
                  <span className={styles.apoio}>
                    {formatarPeriodoAtividade(presenca.inicioAtividade, presenca.fimAtividade)} · presença registrada em{" "}
                    {formatarDataHora(presenca.presencaEm)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.apoio}>Nenhuma presença em atividade registrada ainda.</p>
          )}
        </section>
      )}
    </div>
  );
}
