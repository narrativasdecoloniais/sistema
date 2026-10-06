"use client";

import { useState } from "react";
import { UserCheck } from "lucide-react";
import Botao from "@/components/forms/Botao";
import BuscaUsuario from "./BuscaUsuario";
import CartoesContadores from "./CartoesContadores";
import styles from "./AvaliacaoSubmissoesPainel.module.scss";
import estilos from "./CredenciamentoPainel.module.scss";

const ROTULOS_ORIGEM = { QR_CODE: "QR code", EQUIPE: "Equipe", CRACHA: "Crachá" };
const QUANTIDADE_RECENTES = 5;

function formatarHora(valor) {
  return new Date(valor).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

// Aba de operação do dia: números, busca para credenciar quem está sem crachá
// e os últimos credenciamentos, para conferir de relance. A lista completa
// fica em Credenciados.
export default function CredenciarAba({ inscricoes, aoCredenciar }) {
  const [selecionado, setSelecionado] = useState(null);
  const [credenciando, setCredenciando] = useState(false);

  const credenciados = inscricoes.filter((inscricao) => inscricao.credenciadoEm);
  const recentes = [...credenciados]
    .sort((a, b) => new Date(b.credenciadoEm) - new Date(a.credenciadoEm))
    .slice(0, QUANTIDADE_RECENTES);

  async function credenciarSelecionado() {
    setCredenciando(true);
    if (await aoCredenciar(selecionado.id)) setSelecionado(null);
    setCredenciando(false);
  }

  return (
    <>
      <CartoesContadores
        itens={[
          { rotulo: "Inscritos", valor: inscricoes.length },
          { rotulo: "Credenciados", valor: credenciados.length },
          { rotulo: "Faltam", valor: inscricoes.length - credenciados.length },
        ]}
      />

      <section className={estilos.credenciarBusca} aria-label="Credenciar participante">
        <BuscaUsuario
          id="credenciar-participante"
          rotulo="Credenciar pelo nome, e-mail ou CPF"
          usuarioSelecionado={selecionado}
          onSelecionar={setSelecionado}
        />
        {selecionado && (
          <div>
            <Botao type="button" variante="secundario" carregando={credenciando} onClick={credenciarSelecionado}>
              <UserCheck size={18} strokeWidth={1.5} aria-hidden="true" />
              Credenciar
            </Botao>
          </div>
        )}
        <p className={styles.textoApoio}>Quem ainda não tem inscrição geral é inscrito ao ser credenciado.</p>
      </section>

      {recentes.length > 0 && (
        <section className={estilos.recentes} aria-labelledby="credenciados-recentes">
          <h2 id="credenciados-recentes" className={estilos.subtitulo}>
            Últimos credenciados
          </h2>
          <ul className={estilos.listaRecentes}>
            {recentes.map((inscricao) => (
              <li key={inscricao.id}>
                <span className={styles.nome}>{inscricao.usuario.nome}</span>
                <span className={styles.textoApoio}>
                  {formatarHora(inscricao.credenciadoEm)} · {ROTULOS_ORIGEM[inscricao.credenciamentoOrigem] || "—"}
                  {inscricao.credenciadoPor ? ` · ${inscricao.credenciadoPor.nome}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
