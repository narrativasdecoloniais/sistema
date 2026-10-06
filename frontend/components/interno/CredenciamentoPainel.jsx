"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ScanLine } from "lucide-react";
import CredenciarAba from "./CredenciarAba";
import CredenciadosAba from "./CredenciadosAba";
import CredenciamentoAtividadesAba from "./CredenciamentoAtividadesAba";
import CredenciamentoQrCodesAba from "./CredenciamentoQrCodesAba";
import { useToast } from "./ToastProvider";
import { credenciamentoAdmin } from "@/lib/credenciamento";
import styles from "./AvaliacaoSubmissoesPainel.module.scss";
import estilos from "./CredenciamentoPainel.module.scss";

const ABAS = [
  { chave: "credenciar", rotulo: "Credenciar" },
  { chave: "credenciados", rotulo: "Credenciados" },
  { chave: "atividades", rotulo: "Atividades" },
  { chave: "qr", rotulo: "QR codes" },
];

// Tela de credenciamento da equipe (seção CREDENCIAMENTO), separada por
// tarefa: Credenciar (operação no dia — leitor de crachás e busca), Credenciados
// (tabela), Atividades (presença) e QR codes (preparação: cartazes para
// autocredenciamento). Regras em credenciamento.service.js.
export default function CredenciamentoPainel({ edicaoId, dadosIniciais }) {
  const router = useRouter();
  const { notificar } = useToast();
  const [abaAtiva, setAbaAtiva] = useState("credenciar");
  const [inscricoes, setInscricoes] = useState(dadosIniciais?.inscricoes || []);

  if (!dadosIniciais) {
    return (
      <div className={styles.vazio}>
        <p>Não foi possível carregar o credenciamento.</p>
        <p className={styles.vazioApoio}>Recarregue a página para tentar de novo.</p>
      </div>
    );
  }

  // O leitor de crachás roda em outra tela (muitas vezes noutro aparelho):
  // ao voltar para as abas do evento, a lista é buscada de novo.
  function abrirAba(chave) {
    setAbaAtiva(chave);
    if (chave === "credenciar" || chave === "credenciados") {
      credenciamentoAdmin
        .listar(edicaoId)
        .then((dados) => setInscricoes(dados.inscricoes))
        .catch(() => {});
    }
  }

  function substituir(inscricao) {
    setInscricoes((atual) =>
      atual.some((item) => item.id === inscricao.id)
        ? atual.map((item) => (item.id === inscricao.id ? inscricao : item))
        : [...atual, inscricao]
    );
  }

  async function credenciar(usuarioId) {
    try {
      const resposta = await credenciamentoAdmin.credenciar(edicaoId, usuarioId);
      substituir(resposta.inscricao);
      notificar(resposta.mensagem);
      router.refresh();
      return true;
    } catch (erro) {
      notificar(erro.message, "erro");
      return false;
    }
  }

  async function desfazer(usuarioId) {
    try {
      const resposta = await credenciamentoAdmin.desfazer(edicaoId, usuarioId);
      substituir(resposta.inscricao);
      notificar(resposta.mensagem);
      router.refresh();
    } catch (erro) {
      notificar(erro.message, "erro");
    }
  }

  return (
    <div className={styles.pagina}>
      <div className={styles.cabecalho}>
        <div>
          <h1 className={styles.titulo}>Credenciamento</h1>
          <p className={styles.descricao}>Leia o crachá virtual dos participantes ou credencie pela busca.</p>
        </div>
        <Link href={`/equipe/edicoes/${edicaoId}/credenciamento`} className={estilos.linkPrimario}>
          <ScanLine size={18} strokeWidth={1.5} aria-hidden="true" />
          Abrir leitor de crachás
        </Link>
      </div>

      <div className={styles.abas} role="tablist" aria-label="Seções do credenciamento">
        {ABAS.map((aba) => (
          <button
            key={aba.chave}
            type="button"
            role="tab"
            aria-selected={abaAtiva === aba.chave}
            tabIndex={abaAtiva === aba.chave ? 0 : -1}
            className={`${styles.aba} ${abaAtiva === aba.chave ? styles.abaAtiva : ""}`}
            onClick={() => abrirAba(aba.chave)}
          >
            {aba.rotulo}
          </button>
        ))}
      </div>

      {abaAtiva === "credenciar" && <CredenciarAba inscricoes={inscricoes} aoCredenciar={credenciar} />}
      {abaAtiva === "credenciados" && (
        <CredenciadosAba inscricoes={inscricoes} aoCredenciar={credenciar} aoDesfazer={desfazer} />
      )}
      {abaAtiva === "atividades" && (
        <CredenciamentoAtividadesAba
          edicaoId={edicaoId}
          edicao={dadosIniciais.edicao}
          atividadesIniciais={dadosIniciais.atividades}
        />
      )}
      {abaAtiva === "qr" && (
        <CredenciamentoQrCodesAba
          edicaoId={edicaoId}
          edicao={dadosIniciais.edicao}
          temAtividades={dadosIniciais.atividades.length > 0}
        />
      )}
    </div>
  );
}
