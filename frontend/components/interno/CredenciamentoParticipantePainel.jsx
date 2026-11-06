"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IdCard, ScanLine } from "lucide-react";
import CrachaParticipante from "./CrachaParticipante";
import LeitorQrCode from "./LeitorQrCode";
import { formatarPeriodoAtividade } from "@/lib/publico";
import { buscarMinhaSituacaoCredenciamento, ehTokenCracha, extrairTokenDoQr } from "@/lib/credenciamento";
import styles from "./CredenciamentoParticipante.module.scss";

const ABAS = [
  { chave: "cracha", rotulo: "Meu crachá", Icone: IdCard },
  { chave: "ler", rotulo: "Ler QR code", Icone: ScanLine },
];

function formatarDataHora(valor) {
  return new Date(valor).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

// Autocredenciamento: a pessoa lê o QR code do evento (credenciamento geral)
// ou de uma atividade (presença) pela câmera; a leitura leva a
// /participante/credenciamento/<token>, que faz o resto (LeituraCredenciamento).
function LeitorParticipante() {
  const router = useRouter();
  const [situacao, setSituacao] = useState(null);
  const [erroLeitura, setErroLeitura] = useState("");

  useEffect(() => {
    buscarMinhaSituacaoCredenciamento()
      .then(setSituacao)
      .catch(() => setSituacao({ erro: true }));
  }, []);

  function aoLer(texto) {
    if (ehTokenCracha(texto)) {
      setErroLeitura("Este é o crachá de um participante — quem lê o crachá é a equipe do evento.");
      return;
    }
    const token = extrairTokenDoQr(texto);
    if (!token) {
      setErroLeitura("Este QR code não é do credenciamento do Narrativas.");
      return;
    }
    setErroLeitura("");
    router.push(`/participante/credenciamento/${token}`);
  }

  return (
    <>
      <p className={styles.descricao}>
        Leia o QR code do credenciamento, na entrada do evento, ou o QR code afixado em cada atividade para
        registrar a sua presença.
      </p>

      <section className={styles.cartao} aria-label="Leitor de QR code">
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
    </>
  );
}

// Tela única de credenciamento do participante: o crachá virtual (a equipe lê)
// e o leitor de QR code (a pessoa lê o cartaz). A aba vai na URL (?aba=ler)
// para os atalhos do Início e o "Ler outro QR code" caírem direto no leitor.
export default function CredenciamentoParticipantePainel({ abaInicial = "cracha" }) {
  const [aba, setAba] = useState(ABAS.some((item) => item.chave === abaInicial) ? abaInicial : "cracha");

  function abrirAba(chave) {
    setAba(chave);
    // Só atualiza a URL (sem navegar), para recarregar/voltar na mesma aba.
    const url = chave === "cracha" ? "/participante/credenciamento" : `/participante/credenciamento?aba=${chave}`;
    window.history.replaceState(window.history.state, "", url);
  }

  return (
    <div className={styles.pagina}>
      <h1 className={styles.titulo}>Credenciamento</h1>

      <div className={styles.abas} role="tablist" aria-label="Formas de credenciamento">
        {ABAS.map((item) => (
          <button
            key={item.chave}
            type="button"
            role="tab"
            id={`aba-${item.chave}`}
            aria-selected={aba === item.chave}
            aria-controls={`painel-${item.chave}`}
            tabIndex={aba === item.chave ? 0 : -1}
            className={`${styles.aba} ${aba === item.chave ? styles.abaAtiva : ""}`}
            onClick={() => abrirAba(item.chave)}
          >
            <item.Icone size={18} strokeWidth={1.5} aria-hidden="true" />
            {item.rotulo}
          </button>
        ))}
      </div>

      <div id={`painel-${aba}`} role="tabpanel" aria-labelledby={`aba-${aba}`} className={styles.painelAba}>
        {aba === "cracha" ? <CrachaParticipante aoIrParaLeitor={() => abrirAba("ler")} /> : <LeitorParticipante />}
      </div>
    </div>
  );
}
