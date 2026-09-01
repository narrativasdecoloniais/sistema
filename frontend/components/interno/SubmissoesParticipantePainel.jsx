"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import Botao from "@/components/forms/Botao";
import { paraNumeroRomano } from "@/lib/romanos";
import { listarMinhasSubmissoes } from "@/lib/participanteSubmissoes";
import styles from "./SubmissoesParticipantePainel.module.scss";

function formatarData(iso) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default function SubmissoesParticipantePainel() {
  const router = useRouter();
  const [submissoes, setSubmissoes] = useState(null);

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

  return (
    <div className={styles.pagina}>
      <div className={styles.cabecalho}>
        <div>
          <h1 className={styles.titulo}>Minhas submissões</h1>
          <p className={styles.descricao}>Trabalhos que você enviou, como autor principal ou coautor.</p>
        </div>
        <Botao type="button" onClick={() => router.push("/participante/submissoes/nova")}>
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
        <div className={styles.tabelaWrapper}>
          <table className={styles.tabela}>
            <thead>
              <tr>
                <th>Edição</th>
                <th>Modalidade</th>
                <th>Área</th>
                <th>Título</th>
                <th>Autores</th>
                <th>Enviado em</th>
              </tr>
            </thead>
            <tbody>
              {submissoes.map((submissao) => (
                <tr key={submissao.id}>
                  <td data-rotulo="Edição">{paraNumeroRomano(submissao.edicao.numero)}</td>
                  <td data-rotulo="Modalidade">{submissao.modalidadeSubmissao.nome}</td>
                  <td data-rotulo="Área">{submissao.areaSubmissao?.titulo || "—"}</td>
                  <td data-rotulo="Título">{submissao.titulo}</td>
                  <td data-rotulo="Autores">{submissao.autores.map((autor) => autor.nome).join(", ")}</td>
                  <td data-rotulo="Enviado em">{formatarData(submissao.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
