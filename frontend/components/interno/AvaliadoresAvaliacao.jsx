"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import Botao from "@/components/forms/Botao";
import Modal from "./Modal";
import ModalConfirmacao from "./ModalConfirmacao";
import CampoTexto from "./CampoTexto";
import CampoMultiSelect from "./CampoMultiSelect";
import BuscaUsuario from "./BuscaUsuario";
import CabecalhoTabela, { LinhaSemResultado } from "./CabecalhoTabela";
import BotaoExportarTabela from "./BotaoExportarTabela";
import useTabela from "./useTabela";
import { useToast } from "./ToastProvider";
import { apiClient } from "@/lib/apiClient";
import { avaliadorSchema, extrairErros } from "@/lib/validacao";
import styles from "./AvaliacaoSubmissoesPainel.module.scss";

// Opções do multiselect de áreas — prefixo da modalidade porque áreas de
// modalidades diferentes podem ter o mesmo título.
function opcoesDeAreas(modalidades) {
  return modalidades.flatMap((modalidade) =>
    (modalidade.areas || []).map((area) => ({
      id: area.id,
      nome: modalidades.length > 1 ? `${modalidade.nome}: ${area.titulo}` : area.titulo,
    }))
  );
}

function rotuloArea(area, variasModalidades) {
  return variasModalidades ? `${area.modalidadeSubmissao.nome}: ${area.titulo}` : area.titulo;
}

export default function AbaAvaliadores({ edicaoId, avaliadores, modalidades, recarregar }) {
  const { notificar } = useToast();
  const [adicionando, setAdicionando] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [removendoId, setRemovendoId] = useState(null);
  const [processandoRemocao, setProcessandoRemocao] = useState(false);

  const variasModalidades = modalidades.length > 1;
  const opcoesAreas = useMemo(() => opcoesDeAreas(modalidades), [modalidades]);

  const colunas = useMemo(
    () => [
      { chave: "nome", rotulo: "Nome", valor: (avaliador) => avaliador.usuario.nome },
      { chave: "email", rotulo: "E-mail", valor: (avaliador) => avaliador.usuario.email },
      {
        chave: "areas",
        rotulo: "Áreas",
        valor: (avaliador) => avaliador.areas.map((area) => rotuloArea(area, variasModalidades)).join(", ") || null,
        filtro: "select",
        opcoes: opcoesAreas.map((area) => ({ valor: area.id, rotulo: area.nome })),
        corresponde: (avaliador, areaId) => avaliador.areas.some((area) => area.id === areaId),
      },
      {
        chave: "atribuidas",
        rotulo: "Atribuídas",
        valor: (avaliador) => avaliador.totalAtribuidas,
        classe: styles.colunaCurta,
      },
      {
        chave: "avaliadas",
        rotulo: "Avaliadas",
        valor: (avaliador) => avaliador.totalAvaliadas,
        classe: styles.colunaCurta,
      },
      {
        chave: "pendentes",
        rotulo: "Pendentes",
        valor: (avaliador) => avaliador.totalPendentes,
        classe: styles.colunaCurta,
      },
      {
        chave: "conta",
        rotulo: "Conta",
        valor: (avaliador) => (avaliador.convitePendente ? "Convite pendente" : "Ativa"),
        filtro: "select",
        opcoes: [
          { valor: "ATIVA", rotulo: "Ativa" },
          { valor: "CONVITE", rotulo: "Convite pendente" },
        ],
        corresponde: (avaliador, valor) => avaliador.convitePendente === (valor === "CONVITE"),
      },
    ],
    [opcoesAreas, variasModalidades]
  );

  const tabela = useTabela(avaliadores, colunas);
  const avaliadorEmEdicao = avaliadores.find((avaliador) => avaliador.id === editandoId);
  const avaliadorEmRemocao = avaliadores.find((avaliador) => avaliador.id === removendoId);

  async function remover() {
    setProcessandoRemocao(true);
    try {
      await apiClient.delete(`/edicoes/${edicaoId}/avaliacoes/avaliadores/${removendoId}`);
      notificar("Avaliador removido com sucesso.");
      await recarregar();
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setProcessandoRemocao(false);
      setRemovendoId(null);
    }
  }

  return (
    <>
      <div className={styles.barraAcoes}>
        <p className={styles.textoApoio}>
          Cada avaliador recebe automaticamente os trabalhos das áreas marcadas, exceto aqueles de que é autor.
        </p>
        <Botao type="button" onClick={() => setAdicionando(true)}>
          <Plus size={18} strokeWidth={1.5} aria-hidden="true" />
          Adicionar avaliador
        </Botao>
      </div>

      {avaliadores.length === 0 ? (
        <div className={styles.vazio}>
          <p>Nenhum avaliador cadastrado nesta edição.</p>
          <p className={styles.vazioApoio}>
            Adicione uma conta existente ou convide alguém por e-mail. Organizadores que forem avaliar também entram aqui.
          </p>
        </div>
      ) : (
        <div className={styles.tabelaWrapper}>
          <BotaoExportarTabela tabela={tabela} nomeArquivo="avaliadores" nomeAba="Avaliadores" />
          <table className={styles.tabela}>
            <CabecalhoTabela tabela={tabela} idTabela="avaliadores" classeAcoes={styles.colunaAcoes} />
            <tbody>
              {tabela.linhasVisiveis.length === 0 && (
                <LinhaSemResultado tabela={tabela} colSpan={colunas.length + 1} />
              )}
              {tabela.linhasVisiveis.map((avaliador) => (
                <tr key={avaliador.id}>
                  <td data-rotulo="Nome">{avaliador.usuario.nome}</td>
                  <td data-rotulo="E-mail">{avaliador.usuario.email}</td>
                  <td data-rotulo="Áreas">
                    {avaliador.areas.length ? (
                      avaliador.areas.map((area) => rotuloArea(area, variasModalidades)).join(", ")
                    ) : (
                      <span className={styles.textoSuave}>Só atribuições manuais</span>
                    )}
                  </td>
                  <td data-rotulo="Atribuídas" className={styles.colunaCurta}>
                    {avaliador.totalAtribuidas}
                  </td>
                  <td data-rotulo="Avaliadas" className={styles.colunaCurta}>
                    {avaliador.totalAvaliadas}
                  </td>
                  <td data-rotulo="Pendentes" className={styles.colunaCurta}>
                    {avaliador.totalPendentes}
                  </td>
                  <td data-rotulo="Conta">
                    {avaliador.convitePendente ? (
                      <span className={styles.textoSuave}>Convite pendente</span>
                    ) : (
                      "Ativa"
                    )}
                  </td>
                  <td data-rotulo="Ações" className={styles.colunaAcoes}>
                    <div className={styles.acoesLinha}>
                      <button
                        type="button"
                        className={styles.botaoIcone}
                        aria-label={`Editar áreas de ${avaliador.usuario.nome}`}
                        onClick={() => setEditandoId(avaliador.id)}
                      >
                        <Pencil size={16} strokeWidth={1.5} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className={`${styles.botaoIcone} ${styles.botaoIconePerigo}`}
                        aria-label={`Remover ${avaliador.usuario.nome} dos avaliadores`}
                        onClick={() => setRemovendoId(avaliador.id)}
                      >
                        <Trash2 size={16} strokeWidth={1.5} aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {adicionando && (
        <Modal titulo="Adicionar avaliador" onFechar={() => setAdicionando(false)}>
          <AvaliadorForm
            edicaoId={edicaoId}
            opcoesAreas={opcoesAreas}
            aoCancelar={() => setAdicionando(false)}
            aoSalvar={async () => {
              setAdicionando(false);
              await recarregar();
            }}
          />
        </Modal>
      )}

      {avaliadorEmEdicao && (
        <Modal titulo={`Áreas de ${avaliadorEmEdicao.usuario.nome}`} onFechar={() => setEditandoId(null)}>
          <AvaliadorForm
            edicaoId={edicaoId}
            avaliador={avaliadorEmEdicao}
            opcoesAreas={opcoesAreas}
            aoCancelar={() => setEditandoId(null)}
            aoSalvar={async () => {
              setEditandoId(null);
              await recarregar();
            }}
          />
        </Modal>
      )}

      {avaliadorEmRemocao && (
        <ModalConfirmacao
          titulo="Remover avaliador"
          mensagem={`Remover ${avaliadorEmRemocao.usuario.nome} dos avaliadores desta edição? As atribuições pendentes dele(a) serão descartadas. Avaliadores que já registraram decisões não podem ser removidos.`}
          rotuloConfirmar="Remover"
          confirmando={processandoRemocao}
          onConfirmar={remover}
          onCancelar={() => setRemovendoId(null)}
        />
      )}
    </>
  );
}

// Sem `avaliador`: cadastro (conta existente via busca OU convite por
// e-mail). Com `avaliador`: só edita as áreas.
function AvaliadorForm({ edicaoId, avaliador, opcoesAreas, aoCancelar, aoSalvar }) {
  const { notificar } = useToast();
  const editando = Boolean(avaliador);

  const [modo, setModo] = useState("conta");
  const [usuario, setUsuario] = useState(null);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [areaIds, setAreaIds] = useState(() => (avaliador ? avaliador.areas.map((area) => area.id) : []));
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);

  async function salvar(evento) {
    evento.preventDefault();

    if (editando) {
      setSalvando(true);
      try {
        await apiClient.patch(`/edicoes/${edicaoId}/avaliacoes/avaliadores/${avaliador.id}`, { areaIds });
        notificar("Áreas do avaliador atualizadas.");
        await aoSalvar();
      } catch (erro) {
        notificar(erro.message, "erro");
      } finally {
        setSalvando(false);
      }
      return;
    }

    if (modo === "conta" && !usuario) {
      setErros({ usuarioId: "Selecione uma conta" });
      return;
    }

    const payload = modo === "conta" ? { usuarioId: usuario.id, areaIds } : { nome, email, areaIds };
    const resultado = avaliadorSchema.safeParse(payload);
    if (!resultado.success) {
      setErros(extrairErros(resultado));
      return;
    }
    setErros({});
    setSalvando(true);

    try {
      await apiClient.post(`/edicoes/${edicaoId}/avaliacoes/avaliadores`, resultado.data);
      notificar(
        modo === "convite"
          ? "Avaliador adicionado. Se o e-mail ainda não tinha conta, enviamos um convite para definir a senha."
          : "Avaliador adicionado e avisado por e-mail."
      );
      await aoSalvar();
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form className={styles.formulario} onSubmit={salvar}>
      {!editando && (
        <>
          <div className={styles.alternador} role="radiogroup" aria-label="Como adicionar">
            <button
              type="button"
              role="radio"
              aria-checked={modo === "conta"}
              className={`${styles.opcaoAlternador} ${modo === "conta" ? styles.opcaoAtiva : ""}`}
              onClick={() => {
                setModo("conta");
                setErros({});
              }}
            >
              Conta existente
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={modo === "convite"}
              className={`${styles.opcaoAlternador} ${modo === "convite" ? styles.opcaoAtiva : ""}`}
              onClick={() => {
                setModo("convite");
                setErros({});
              }}
            >
              Convidar por e-mail
            </button>
          </div>

          {modo === "conta" ? (
            <BuscaUsuario
              id="buscaAvaliador"
              rotulo="Avaliador"
              usuarioSelecionado={usuario}
              onSelecionar={setUsuario}
              erro={erros.usuarioId}
            />
          ) : (
            <>
              <CampoTexto
                id="nomeAvaliador"
                rotulo="Nome completo"
                value={nome}
                onChange={(evento) => setNome(evento.target.value)}
                erro={erros.nome}
              />
              <CampoTexto
                id="emailAvaliador"
                rotulo="E-mail"
                type="email"
                value={email}
                onChange={(evento) => setEmail(evento.target.value)}
                erro={erros.email}
              />
              <p className={styles.textoApoio}>
                Se o e-mail já tiver conta, ela é usada. Se não, enviamos um convite para a pessoa definir a senha.
              </p>
            </>
          )}
        </>
      )}

      <CampoMultiSelect
        id="areasAvaliador"
        rotulo="Áreas que avalia"
        value={areaIds}
        onChange={setAreaIds}
        options={opcoesAreas}
        placeholder="Nenhuma — só atribuições manuais"
        vazio="Nenhuma área cadastrada em Modalidades de submissão."
      />

      <div className={styles.acoesFormulario}>
        <Botao type="button" variante="secundario" onClick={aoCancelar}>
          Cancelar
        </Botao>
        <Botao type="submit" carregando={salvando}>
          {editando ? "Salvar áreas" : "Adicionar"}
        </Botao>
      </div>
    </form>
  );
}
