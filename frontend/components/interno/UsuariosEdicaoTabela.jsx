"use client";

import { ShieldPlus } from "lucide-react";
import CabecalhoTabela, { LinhaSemResultado } from "./CabecalhoTabela";
import BotaoExportarTabela from "./BotaoExportarTabela";
import useTabela from "./useTabela";
import { formatarIdentificacao } from "@/lib/identificacao";
import styles from "./ParticipantesPainel.module.scss";

const ROTULO_PAPEL = {
  ADMIN: "Administrador",
  ORGANIZADOR: "Organizador",
  PARTICIPANTE: "Participante",
};

// Papel efetivo mais alto da conta (enum PapelUsuario): ADMIN > ORGANIZADOR.
function papelPrincipal(usuario) {
  if (usuario.papeis.includes("ADMIN")) return "ADMIN";
  if (usuario.papeis.includes("ORGANIZADOR")) return "ORGANIZADOR";
  return "PARTICIPANTE";
}

const COLUNAS = [
  { chave: "nome", rotulo: "Nome", valor: (usuario) => usuario.nome },
  { chave: "email", rotulo: "E-mail", valor: (usuario) => usuario.email },
  {
    chave: "cpf",
    rotulo: "CPF / Documento",
    valor: (usuario) => usuario.cpf || usuario.documentoEstrangeiro || null,
    // Aceita busca com ou sem pontuação (e pelo país, no caso de estrangeiro).
    texto: (usuario) =>
      formatarIdentificacao(usuario) ? `${formatarIdentificacao(usuario)} ${usuario.cpf || ""}` : "",
    exportar: (usuario) => formatarIdentificacao(usuario) || "",
  },
  { chave: "instituicao", rotulo: "Instituição", valor: (usuario) => usuario.instituicao || null },
  {
    chave: "papel",
    rotulo: "Papel",
    valor: papelPrincipal,
    filtro: "select",
    opcoes: Object.entries(ROTULO_PAPEL).map(([valor, rotulo]) => ({ valor, rotulo })),
    exportar: (usuario) => ROTULO_PAPEL[papelPrincipal(usuario)],
  },
  {
    chave: "inscritoNaEdicao",
    rotulo: "Inscrito na edição",
    valor: (usuario) => (usuario.inscritoNaEdicao ? "SIM" : "NAO"),
    filtro: "select",
    opcoes: [
      { valor: "SIM", rotulo: "Sim" },
      { valor: "NAO", rotulo: "Não" },
    ],
    exportar: (usuario) => (usuario.inscritoNaEdicao ? "Sim" : "Não"),
  },
  {
    chave: "atividades",
    rotulo: "Atividades",
    valor: (usuario) => usuario.atividades.confirmadas,
  },
  {
    chave: "listaEspera",
    rotulo: "Lista de espera",
    valor: (usuario) => usuario.atividades.listaEspera,
  },
  {
    chave: "submissoes",
    rotulo: "Submissões",
    // Quantidade de submissões da edição em que a conta enviou ou é autora/
    // coautora. Ordena pelo número; o filtro só separa quem tem de quem não tem.
    valor: (usuario) => usuario.submissoes,
    filtro: "select",
    opcoes: [
      { valor: "COM", rotulo: "Com submissão" },
      { valor: "SEM", rotulo: "Sem submissão" },
    ],
    corresponde: (usuario, valor) => (valor === "COM" ? usuario.submissoes > 0 : usuario.submissoes === 0),
  },
];

// Aba "Usuários" da tela de Participantes (ADMIN-only): todas as contas da
// base, com a situação de cada uma na edição aberta. A única ação é promover
// a administrador (a confirmação e a chamada ficam no ParticipantesPainel,
// as mesmas da aba "Equipe"); o resto da gestão da equipe continua lá.
export default function UsuariosEdicaoTabela({ usuarios, aoPromover }) {
  const tabela = useTabela(usuarios, COLUNAS);

  if (usuarios.length === 0) {
    return (
      <div className={styles.vazio}>
        <p>Nenhum usuário encontrado.</p>
      </div>
    );
  }

  return (
    <div className={styles.tabelaWrapper}>
      <BotaoExportarTabela tabela={tabela} nomeArquivo="usuarios" nomeAba="Usuários" />
      <table className={styles.tabela}>
        <CabecalhoTabela tabela={tabela} idTabela="usuarios-edicao" classeAcoes={styles.colunaAcoes} />
        <tbody>
          {tabela.linhasVisiveis.length === 0 && (
            <LinhaSemResultado tabela={tabela} colSpan={COLUNAS.length + 1} />
          )}
          {tabela.linhasVisiveis.map((usuario) => {
            const papel = papelPrincipal(usuario);

            return (
              <tr key={usuario.id}>
                <td data-rotulo="Nome">{usuario.nome}</td>
                <td data-rotulo="E-mail">{usuario.email}</td>
                <td data-rotulo="CPF / Documento">{formatarIdentificacao(usuario) || "—"}</td>
                <td data-rotulo="Instituição">{usuario.instituicao || "—"}</td>
                <td data-rotulo="Papel">
                  {papel === "PARTICIPANTE" ? (
                    ROTULO_PAPEL[papel]
                  ) : (
                    <span className={`${styles.tag} ${papel === "ADMIN" ? styles.tagAdmin : ""}`}>
                      {ROTULO_PAPEL[papel]}
                    </span>
                  )}
                </td>
                <td data-rotulo="Inscrito na edição">{usuario.inscritoNaEdicao ? "Sim" : "Não"}</td>
                <td data-rotulo="Atividades">{usuario.atividades.confirmadas}</td>
                <td data-rotulo="Lista de espera">{usuario.atividades.listaEspera}</td>
                <td data-rotulo="Submissões">{usuario.submissoes}</td>
                <td data-rotulo="Ações" className={styles.colunaAcoes}>
                  {papel !== "ADMIN" && (
                    <div className={styles.acoesLinha}>
                      <button
                        type="button"
                        className={styles.botaoIcone}
                        aria-label={`Promover ${usuario.nome} a administrador`}
                        title="Promover a administrador"
                        onClick={() => aoPromover(usuario)}
                      >
                        <ShieldPlus size={16} strokeWidth={1.5} aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
