"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, MailPlus, GitMerge, Trash2, ShieldPlus, ShieldMinus, Settings2 } from "lucide-react";
import Botao from "@/components/forms/Botao";
import Modal from "./Modal";
import ModalConfirmacao from "./ModalConfirmacao";
import ParticipanteForm from "./ParticipanteForm";
import AlterarEmailUsuarioForm from "./AlterarEmailUsuarioForm";
import UnificarContasForm from "./UnificarContasForm";
import SeletorSecoesAdmin from "./SeletorSecoesAdmin";
import UsuariosEdicaoTabela from "./UsuariosEdicaoTabela";
import CabecalhoTabela, { LinhaSemResultado } from "./CabecalhoTabela";
import BotaoExportarTabela from "./BotaoExportarTabela";
import useTabela from "./useTabela";
import { useToast } from "./ToastProvider";
import { apiClient } from "@/lib/apiClient";
import { formatarIdentificacao } from "@/lib/identificacao";
import { temPapel } from "@/lib/permissoes";
import { GRUPOS_SECOES_ADMIN, ROTULOS_SECOES_ADMIN } from "@/lib/secoesAdmin";
import styles from "./ParticipantesPainel.module.scss";

function rotuloPermissoes(participante) {
  if (participante.acessoCompleto) return "Acesso completo";
  const total = participante.secoesPermitidas?.length || 0;
  if (total === 0) return "Sem seções liberadas";
  if (total === 1) return ROTULOS_SECOES_ADMIN[participante.secoesPermitidas[0]] || "1 seção";
  return `${total} seções`;
}

function ehAdmin(participante) {
  return participante.papeis.includes("ADMIN");
}

function rotuloPapel(participante) {
  return ehAdmin(participante) ? "Administrador" : "Organizador";
}

function textoPermissoes(participante) {
  return ehAdmin(participante) ? "Acesso total" : rotuloPermissoes(participante);
}

// Seções do enum SecaoAdmin, com o nome do grupo pai nos subitens pra
// desambiguar rótulos repetidos (ex.: "Apresentação" da página e da submissão).
const OPCOES_SECOES = GRUPOS_SECOES_ADMIN.flatMap((grupo) =>
  grupo.itens.flatMap((item) =>
    item.subitens
      ? item.subitens.map((sub) => ({ valor: sub.valor, rotulo: `${item.rotulo}: ${sub.rotulo}` }))
      : [{ valor: item.valor, rotulo: item.rotulo }]
  )
);

const COLUNAS = [
  { chave: "nome", rotulo: "Nome", valor: (participante) => participante.nome },
  { chave: "email", rotulo: "E-mail", valor: (participante) => participante.email },
  {
    chave: "cpf",
    rotulo: "CPF / Documento",
    valor: (participante) => participante.cpf || participante.documentoEstrangeiro || null,
    // Aceita busca com ou sem pontuação; "convite" encontra os pendentes.
    texto: (participante) =>
      formatarIdentificacao(participante)
        ? `${formatarIdentificacao(participante)} ${participante.cpf || ""}`
        : "Convite pendente",
    exportar: (participante) => formatarIdentificacao(participante) || "Convite pendente",
  },
  {
    chave: "papel",
    rotulo: "Papel",
    valor: rotuloPapel,
    filtro: "select",
    opcoes: [
      { valor: "Administrador", rotulo: "Administrador" },
      { valor: "Organizador", rotulo: "Organizador" },
    ],
  },
  {
    chave: "permissoes",
    rotulo: "Permissões",
    valor: textoPermissoes,
    filtro: "select",
    opcoes: [
      { valor: "TOTAL", rotulo: "Acesso total/completo" },
      { valor: "NENHUMA", rotulo: "Sem seções liberadas" },
      ...OPCOES_SECOES,
    ],
    // Uma seção específica também casa com quem tem acesso total/completo,
    // já que essas pessoas acessam a seção de fato.
    corresponde: (participante, valor) => {
      const total = ehAdmin(participante) || participante.acessoCompleto;
      if (valor === "TOTAL") return total;
      const secoes = participante.secoesPermitidas || [];
      if (valor === "NENHUMA") return !total && secoes.length === 0;
      return total || secoes.includes(valor);
    },
  },
];

const TEXTOS_CONFIRMACAO = {
  promover: {
    titulo: "Promover a administrador",
    rotulo: "Promover",
    mensagem: (nome) =>
      `${nome} passará a ter acesso total ao Narrativas, inclusive aos dados de todos os usuários e à gestão da equipe.`,
  },
  rebaixar: {
    titulo: "Remover de administrador",
    rotulo: "Remover de administrador",
    mensagem: (nome) =>
      `${nome} perderá o acesso total e continuará na equipe como organizador(a), só com as seções liberadas nas permissões — revise-as em seguida. Pode levar alguns minutos até valer para quem já está logado.`,
  },
  remover: {
    titulo: "Remover organizador",
    rotulo: "Remover",
    mensagem: (nome) =>
      `${nome} perderá o acesso de organizador. Essa ação não pode ser desfeita.`,
  },
};

export default function ParticipantesPainel({ participantesIniciais, usuarios = [], usuarioLogado }) {
  const router = useRouter();
  const { notificar } = useToast();
  const souAdmin = temPapel(usuarioLogado, "ADMIN");

  const [participantes, setParticipantes] = useState(participantesIniciais);
  const [abaAtiva, setAbaAtiva] = useState(souAdmin ? "usuarios" : "equipe");
  const [modalAberto, setModalAberto] = useState(false);
  const [modalEmailAberto, setModalEmailAberto] = useState(false);
  const [modalUnificarAberto, setModalUnificarAberto] = useState(false);
  const [processandoId, setProcessandoId] = useState(null);
  const [confirmando, setConfirmando] = useState(null);
  const [editandoPermissoesId, setEditandoPermissoesId] = useState(null);
  const [permissoesEmEdicao, setPermissoesEmEdicao] = useState(null);
  const [salvandoPermissoes, setSalvandoPermissoes] = useState(false);
  const tabela = useTabela(participantes, COLUNAS);

  function fecharModal() {
    setModalAberto(false);
  }

  function aoSalvar(participanteSalvo) {
    setParticipantes((atual) => [...atual, participanteSalvo]);
    fecharModal();
    router.refresh();
  }

  function fecharModalEmail() {
    setModalEmailAberto(false);
  }

  function aoSalvarEmail(usuarioAtualizado) {
    setParticipantes((atual) =>
      atual.map((item) => (item.id === usuarioAtualizado.id ? { ...item, ...usuarioAtualizado } : item))
    );
    fecharModalEmail();
    router.refresh();
  }

  function fecharModalUnificar() {
    setModalUnificarAberto(false);
  }

  // A tabela só lista organizadores/admins, que nunca entram numa unificação
  // (o backend bloqueia), então não há linha pra atualizar — só recarrega.
  function aoUnificar() {
    fecharModalUnificar();
    router.refresh();
  }

  async function removerParticipante(id) {
    setProcessandoId(id);

    try {
      await apiClient.delete(`/organizadores/${id}`);
      setParticipantes((atual) => atual.filter((item) => item.id !== id));
      notificar("Organizador removido com sucesso.");
      router.refresh();
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setProcessandoId(null);
      setConfirmando(null);
    }
  }

  // Vale para as duas abas: da "Usuários" pode vir um participante que ainda
  // não está na equipe — aí ele entra na lista da "Equipe".
  async function promoverAdmin(id) {
    setProcessandoId(id);

    try {
      const resposta = await apiClient.patch(`/organizadores/${id}/promover`, {});
      setParticipantes((atual) =>
        atual.some((item) => item.id === id)
          ? atual.map((item) => (item.id === id ? resposta.organizador : item))
          : [...atual, resposta.organizador]
      );
      notificar(`${resposta.organizador.nome} agora é administrador(a).`);
      router.refresh();
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setProcessandoId(null);
      setConfirmando(null);
    }
  }

  // O admin continua na equipe como organizador, com as permissões por seção
  // que já tinha — a linha só troca de papel.
  async function rebaixarAdmin(id) {
    setProcessandoId(id);

    try {
      const resposta = await apiClient.patch(`/organizadores/${id}/rebaixar`, {});
      setParticipantes((atual) =>
        atual.map((item) => (item.id === id ? resposta.organizador : item))
      );
      notificar(`${resposta.organizador.nome} deixou de ser administrador(a) e agora é organizador(a).`);
      router.refresh();
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setProcessandoId(null);
      setConfirmando(null);
    }
  }

  function abrirEdicaoPermissoes(participante) {
    setEditandoPermissoesId(participante.id);
    setPermissoesEmEdicao({
      acessoCompleto: participante.acessoCompleto,
      secoesPermitidas: participante.secoesPermitidas || [],
    });
  }

  function fecharEdicaoPermissoes() {
    setEditandoPermissoesId(null);
    setPermissoesEmEdicao(null);
  }

  async function salvarPermissoes() {
    setSalvandoPermissoes(true);

    try {
      const resposta = await apiClient.patch(
        `/organizadores/${editandoPermissoesId}/permissoes`,
        permissoesEmEdicao
      );
      setParticipantes((atual) =>
        atual.map((item) => (item.id === editandoPermissoesId ? resposta.organizador : item))
      );
      notificar(
        "Permissões atualizadas. Pode levar alguns minutos até valer para quem já está logado."
      );
      fecharEdicaoPermissoes();
      router.refresh();
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setSalvandoPermissoes(false);
    }
  }

  // Quem vem da aba "Usuários" não está em `participantes` — o nome vem junto.
  const nomeEmConfirmacao = confirmando
    ? confirmando.nome ?? participantes.find((item) => item.id === confirmando.id)?.nome
    : null;

  return (
    <div className={styles.pagina}>
      <div className={styles.cabecalho}>
        <div>
          <h1 className={styles.titulo}>Usuários e participantes</h1>
          <p className={styles.descricao}>
            Administradores têm acesso total ao Narrativas. Organizadores podem ser restritos a
            seções específicas do painel, ou promovidos a administrador.
          </p>
        </div>
        <div className={styles.acoesCabecalho}>
          <Botao type="button" variante="secundario" onClick={() => setModalEmailAberto(true)}>
            <MailPlus size={18} strokeWidth={1.5} aria-hidden="true" />
            Alterar e-mail de usuário
          </Botao>
          <Botao type="button" variante="secundario" onClick={() => setModalUnificarAberto(true)}>
            <GitMerge size={18} strokeWidth={1.5} aria-hidden="true" />
            Unificar contas
          </Botao>
          {souAdmin && (
            <Botao type="button" onClick={() => setModalAberto(true)}>
              <UserPlus size={18} strokeWidth={1.5} aria-hidden="true" />
              Adicionar organizador
            </Botao>
          )}
        </div>
      </div>

      {souAdmin && (
        <div className={styles.abas} role="tablist" aria-label="Visualização de usuários">
          <button
            type="button"
            role="tab"
            aria-selected={abaAtiva === "usuarios"}
            tabIndex={abaAtiva === "usuarios" ? 0 : -1}
            className={`${styles.aba} ${abaAtiva === "usuarios" ? styles.abaAtiva : ""}`}
            onClick={() => setAbaAtiva("usuarios")}
          >
            Usuários
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={abaAtiva === "equipe"}
            tabIndex={abaAtiva === "equipe" ? 0 : -1}
            className={`${styles.aba} ${abaAtiva === "equipe" ? styles.abaAtiva : ""}`}
            onClick={() => setAbaAtiva("equipe")}
          >
            Equipe
          </button>
        </div>
      )}

      {abaAtiva === "usuarios" ? (
        <UsuariosEdicaoTabela
          usuarios={usuarios}
          aoPromover={(usuario) => setConfirmando({ id: usuario.id, nome: usuario.nome, tipo: "promover" })}
        />
      ) : (
        <>
          {participantes.length === 0 ? (
            <div className={styles.vazio}>
              <p>Nenhum organizador cadastrado ainda.</p>
              <p className={styles.vazioApoio}>
                Adicione alguém para dividir a gestão do Narrativas com você.
              </p>
            </div>
          ) : (
            <div className={styles.tabelaWrapper}>
              <BotaoExportarTabela tabela={tabela} nomeArquivo="usuarios-e-participantes" nomeAba="Participantes" />
              <table className={styles.tabela}>
                <CabecalhoTabela tabela={tabela} idTabela="participantes" classeAcoes={styles.colunaAcoes} />
                <tbody>
                  {tabela.linhasVisiveis.length === 0 && (
                    <LinhaSemResultado tabela={tabela} colSpan={COLUNAS.length + 1} />
                  )}
                  {tabela.linhasVisiveis.map((participante) => {
                    const eAdmin = ehAdmin(participante);

                    return (
                      <tr key={participante.id}>
                        <td data-rotulo="Nome">{participante.nome}</td>
                        <td data-rotulo="E-mail">{participante.email}</td>
                        <td data-rotulo="CPF / Documento">
                          {formatarIdentificacao(participante) || "Convite pendente"}
                        </td>
                        <td data-rotulo="Papel">
                          <span className={`${styles.tag} ${eAdmin ? styles.tagAdmin : ""}`}>
                            {rotuloPapel(participante)}
                          </span>
                        </td>
                        <td data-rotulo="Permissões">{textoPermissoes(participante)}</td>
                        <td data-rotulo="Ações" className={styles.colunaAcoes}>
                          {eAdmin && souAdmin && participante.id !== usuarioLogado?.id && (
                            <div className={styles.acoesLinha}>
                              <button
                                type="button"
                                className={`${styles.botaoIcone} ${styles.botaoIconePerigo}`}
                                aria-label={`Remover ${participante.nome} de administrador`}
                                onClick={() =>
                                  setConfirmando({ id: participante.id, tipo: "rebaixar" })
                                }
                              >
                                <ShieldMinus size={16} strokeWidth={1.5} aria-hidden="true" />
                              </button>
                            </div>
                          )}
                          {!eAdmin && souAdmin && (
                            <div className={styles.acoesLinha}>
                              <button
                                type="button"
                                className={styles.botaoIcone}
                                aria-label={`Editar permissões de ${participante.nome}`}
                                onClick={() => abrirEdicaoPermissoes(participante)}
                              >
                                <Settings2 size={16} strokeWidth={1.5} aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                className={styles.botaoIcone}
                                aria-label={`Promover ${participante.nome} a administrador`}
                                onClick={() =>
                                  setConfirmando({ id: participante.id, tipo: "promover" })
                                }
                              >
                                <ShieldPlus size={16} strokeWidth={1.5} aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                className={`${styles.botaoIcone} ${styles.botaoIconePerigo}`}
                                aria-label={`Remover ${participante.nome}`}
                                onClick={() =>
                                  setConfirmando({ id: participante.id, tipo: "remover" })
                                }
                              >
                                <Trash2 size={16} strokeWidth={1.5} aria-hidden="true" />
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
          )}
        </>
      )}

      {modalAberto && (
        <Modal titulo="Adicionar organizador" onFechar={fecharModal}>
          <ParticipanteForm aoSalvar={aoSalvar} aoCancelar={fecharModal} />
        </Modal>
      )}

      {modalEmailAberto && (
        <Modal titulo="Alterar e-mail de usuário" onFechar={fecharModalEmail}>
          <AlterarEmailUsuarioForm aoSalvar={aoSalvarEmail} aoCancelar={fecharModalEmail} />
        </Modal>
      )}

      {modalUnificarAberto && (
        <Modal titulo="Unificar contas" onFechar={fecharModalUnificar}>
          <UnificarContasForm aoConcluir={aoUnificar} aoCancelar={fecharModalUnificar} />
        </Modal>
      )}

      {editandoPermissoesId && permissoesEmEdicao && (
        <Modal titulo="Editar permissões" onFechar={fecharEdicaoPermissoes}>
          <div className={styles.formPermissoes}>
            <SeletorSecoesAdmin
              acessoCompleto={permissoesEmEdicao.acessoCompleto}
              secoesSelecionadas={permissoesEmEdicao.secoesPermitidas}
              onAlterarAcessoCompleto={(valor) =>
                setPermissoesEmEdicao((atual) => ({ ...atual, acessoCompleto: valor }))
              }
              onAlterarSecoes={(valor) =>
                setPermissoesEmEdicao((atual) => ({ ...atual, secoesPermitidas: valor }))
              }
            />
            <div className={styles.acoes}>
              <Botao type="button" variante="secundario" onClick={fecharEdicaoPermissoes}>
                Cancelar
              </Botao>
              <Botao type="button" carregando={salvandoPermissoes} onClick={salvarPermissoes}>
                Salvar permissões
              </Botao>
            </div>
          </div>
        </Modal>
      )}

      {confirmando && (
        <ModalConfirmacao
          titulo={TEXTOS_CONFIRMACAO[confirmando.tipo].titulo}
          mensagem={TEXTOS_CONFIRMACAO[confirmando.tipo].mensagem(nomeEmConfirmacao)}
          rotuloConfirmar={TEXTOS_CONFIRMACAO[confirmando.tipo].rotulo}
          perigo={confirmando.tipo !== "promover"}
          confirmando={processandoId === confirmando.id}
          onConfirmar={() => {
            if (confirmando.tipo === "promover") return promoverAdmin(confirmando.id);
            if (confirmando.tipo === "rebaixar") return rebaixarAdmin(confirmando.id);
            return removerParticipante(confirmando.id);
          }}
          onCancelar={() => setConfirmando(null)}
        />
      )}
    </div>
  );
}
