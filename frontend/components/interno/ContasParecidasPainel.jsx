"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import UnificarContasForm from "./UnificarContasForm";
import Alerta from "@/components/forms/Alerta";
import { apiClient } from "@/lib/apiClient";
import { formatarIdentificacao, temIdentificacao } from "@/lib/identificacao";
import styles from "./ContasParecidasPainel.module.scss";

function resumoVinculos(conta) {
  const { vinculos } = conta;
  return `${vinculos.submissoes} submissão(ões) · ${vinculos.autorias} autoria(s) · ${vinculos.inscricoesEdicao} inscrição(ões) no evento · ${vinculos.inscricoesAtividade} em atividades`;
}

// Quem permanece: a conta com CPF/documento (ele já é o que o login usa); se as
// duas forem sem CPF, a que está sendo revisada. O gestor pode inverter na
// própria tela de unificação.
function escolherPar(base, parecida) {
  return temIdentificacao(parecida) ? { manter: parecida, remover: base } : { manter: base, remover: parecida };
}

export default function ContasParecidasPainel({ aoFechar }) {
  const [itens, setItens] = useState(null);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [par, setPar] = useState(null);

  const carregar = useCallback(async () => {
    setItens(null);
    setErro("");
    try {
      const resposta = await apiClient.get("/usuarios/contas-parecidas");
      setItens(resposta.itens);
    } catch (e) {
      setErro(e.message);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const filtrados = useMemo(() => {
    if (!itens) return [];
    const termo = busca.trim().toLowerCase();
    if (!termo) return itens;
    return itens.filter((item) => `${item.conta.nome} ${item.conta.email}`.toLowerCase().includes(termo));
  }, [itens, busca]);

  if (par) {
    return (
      <UnificarContasForm
        manterInicial={par.manter}
        removerInicial={par.remover}
        aoCancelar={() => setPar(null)}
        aoConcluir={() => {
          setPar(null);
          carregar();
        }}
      />
    );
  }

  return (
    <div className={styles.painel}>
      <p className={styles.explicacao}>
        Contas sem CPF/documento (vindas do Even3 ou de convite) que têm outra conta com nome parecido ou o mesmo começo
        de e-mail. São só sugestões: confira os dados e, se for a mesma pessoa, abra a unificação.
      </p>

      <Alerta>{erro}</Alerta>

      {itens && (
        <input
          type="search"
          className={styles.busca}
          placeholder="Filtrar por nome ou e-mail"
          value={busca}
          onChange={(evento) => setBusca(evento.target.value)}
          aria-label="Filtrar contas"
        />
      )}

      {!itens && !erro && <p className={styles.status}>Procurando contas parecidas...</p>}
      {itens && (
        <p className={styles.status}>
          {itens.length === 0
            ? "Nenhuma conta sem CPF com possível duplicada."
            : `${filtrados.length} de ${itens.length} conta(s) sem CPF com possível duplicada.`}
        </p>
      )}

      <ul className={styles.lista}>
        {filtrados.map((item) => (
          <li key={item.conta.id} className={styles.grupo}>
            <div className={styles.base}>
              <p className={styles.nome}>{item.conta.nome}</p>
              <p className={styles.detalhe}>
                {item.conta.email} · Sem CPF · {item.conta.emailConfirmado ? "e-mail confirmado" : "e-mail não confirmado"}
              </p>
              <p className={styles.detalhe}>{resumoVinculos(item.conta)}</p>
            </div>
            <ul className={styles.parecidas}>
              {item.parecidas.map((parecida) => (
                <li key={parecida.id} className={styles.parecida}>
                  <div>
                    <p className={styles.nome}>{parecida.nome}</p>
                    <p className={styles.detalhe}>
                      {parecida.email} · {formatarIdentificacao(parecida) || "Sem CPF"}
                    </p>
                    <p className={styles.detalhe}>{resumoVinculos(parecida)}</p>
                    <p className={styles.motivos}>{parecida.motivos.join(" · ")}</p>
                  </div>
                  <button type="button" className={styles.botao} onClick={() => setPar(escolherPar(item.conta, parecida))}>
                    Unificar
                  </button>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      <div className={styles.rodape}>
        <button type="button" className={styles.botao} onClick={aoFechar}>
          Fechar
        </button>
      </div>
    </div>
  );
}
