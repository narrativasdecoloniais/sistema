"use client";

import BuscaUsuario from "./BuscaUsuario";
import CampoTexto from "./CampoTexto";
import styles from "./AvaliacaoSubmissoesPainel.module.scss";

// Pessoa dos certificados de atuação/equipe: uma conta existente (busca) ou
// só o e-mail. Sem conta, o backend liga a conta sozinho quando alguém se
// cadastrar com esse e-mail. valor: { usuario, email }.
export default function CampoContaOuEmail({ id, valor, onChange, erros = {} }) {
  return (
    <>
      <BuscaUsuario
        id={`${id}-conta`}
        rotulo="Conta da pessoa"
        usuarioSelecionado={valor.usuario}
        onSelecionar={(usuario) => onChange({ usuario, email: usuario?.email || valor.email })}
        erro={erros.usuarioId}
      />
      {!valor.usuario && (
        <>
          <CampoTexto
            id={`${id}-email`}
            rotulo="Ou só o e-mail (opcional)"
            type="email"
            value={valor.email}
            onChange={(evento) => onChange({ usuario: null, email: evento.target.value })}
            erro={erros.email}
          />
          <p className={styles.textoApoio}>
            Sem conta, o certificado pode ser enviado para esse e-mail. Se a pessoa se cadastrar depois com ele, o
            certificado também aparece na área dela.
          </p>
        </>
      )}
    </>
  );
}

export function situacaoConta(pessoa) {
  if (pessoa.usuario) return "COM_CONTA";
  return pessoa.email ? "SEM_CONTA" : "SEM_EMAIL";
}

export const ROTULOS_SITUACAO_CONTA = {
  COM_CONTA: "Com conta",
  SEM_CONTA: "Só e-mail",
  SEM_EMAIL: "Sem e-mail",
};

// Payload pro backend: a conta escolhida tem prioridade sobre o e-mail.
export function contaOuEmailParaPayload(valor) {
  return valor.usuario ? { usuarioId: valor.usuario.id } : { usuarioId: null, email: valor.email.trim() || null };
}
