"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import Botao from "@/components/forms/Botao";
import { paraNumeroRomano } from "@/lib/romanos";
import { listarMinhasSubmissoes } from "@/lib/participanteSubmissoes";
import { listarModalidadesSubmissaoPublicas, prazoSubmissaoAberto } from "@/lib/publico";
import styles from "./SubmissoesParticipantePainel.module.scss";

function formatarData(iso) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default function SubmissoesParticipantePainel() {
  const router = useRouter();
  const [submissoes, setSubmissoes] = useState(null);
  const [modalidades, setModalidades] = useState(null);

  useEffect(() => {
    let cancelado = false;
    listarMinhasSubmissoes()
      .then((dados) => {
        if (!cancelado) setSubmissoes(dados);
      })
      .catch(() => {
        if (!cancelado) setSubmissoes([]);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    let cancelado = false;
    listarModalidadesSubmissaoPublicas()
      .then((dados) => {
        if (!cancelado) setModalidades(dados);
      })
      .catch(() => {
        if (!cancelado) setModalidades([]);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  // Cada modalidade tem seu próprio prazo, então o botão só é bloqueado
  // quando nenhuma delas está aberta — com pelo menos uma aberta, o
  // próprio formulário (FormularioSubmissaoParticipante) já impede a
  // escolha das modalidades encerradas.
  const carregandoModalidades = modalidades === null;
  const temModalidadeAberta = (modalidades || []).some((modalidade) =>
    prazoSubmissaoAberto(modalidade.prazoInicio, modalidade.prazoFim)
  );
  const novaSubmissaoBloqueada = !carregandoModalidades && !temModalidadeAberta;

  return (
    <div className={styles.pagina}>
      <div className={styles.cabecalho}>
        <div>
          <h1 className={styles.titulo}>Minhas submissões</h1>
          <p className={styles.descricao}>Trabalhos que você enviou, como autor principal ou coautor.</p>
          {novaSubmissaoBloqueada && (
            <p className={styles.avisoPrazo}>Nenhuma modalidade de submissão está com prazo aberto no momento.</p>
          )}
        </div>
        <Botao
          type="button"
          onClick={() => router.push("/participante/submissoes/nova")}
          disabled={carregandoModalidades || novaSubmissaoBloqueada}
          title={novaSubmissaoBloqueada ? "Nenhuma modalidade de submissão está com prazo aberto no momento." : undefined}
        >
          <Plus size={18} strokeWidth={1.5} aria-hidden="true" />
          Nova submissão
        </Botao>
      </div>

      {submissoes === null ? (
        <div className={styles.vazio}>
          <p>Carregando...</p>
        </div>
      ) : submissoes.length === 0 ? (
        <div className={styles.vazio}>
          <p>Você ainda não enviou nenhum trabalho.</p>
          <p className={styles.vazioApoio}>Use o botão acima para fazer sua primeira submissão.</p>
        </div>
      ) : (
        <div className={styles.grade}>
          {submissoes.map((submissao) => (
            <article key={submissao.id} className={styles.cartao}>
              <div className={styles.cartaoCabecalho}>
                <h3 className={styles.cartaoTitulo}>{submissao.titulo}</h3>
                <span className={styles.cartaoEdicao}>{paraNumeroRomano(submissao.edicao.numero)}</span>
              </div>
              <p className={styles.cartaoMeta}>
                {submissao.modalidadeSubmissao.nome}
                {submissao.areaSubmissao?.titulo ? ` · ${submissao.areaSubmissao.titulo}` : ""}
              </p>
              <p className={styles.cartaoAutores}>
                {submissao.autores.map((autor) => autor.nome).join(", ")}
              </p>
              <p className={styles.cartaoData}>Enviado em {formatarData(submissao.createdAt)}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
