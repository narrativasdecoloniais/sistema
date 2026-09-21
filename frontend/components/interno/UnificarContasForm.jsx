"use client";

import { useEffect, useState } from "react";
import BuscaUsuario from "./BuscaUsuario";
import ModalConfirmacao from "./ModalConfirmacao";
import Botao from "@/components/forms/Botao";
import Alerta from "@/components/forms/Alerta";
import { apiClient } from "@/lib/apiClient";
import { formatarCpf } from "@/lib/cpf";
import { useToast } from "./ToastProvider";
import formStyles from "./ParticipanteForm.module.scss";
import styles from "./UnificarContasForm.module.scss";

function CartaoConta({ titulo, conta }) {
  const { vinculos } = conta;

  return (
    <div className={styles.cartao}>
      <p className={styles.cartaoTitulo}>{titulo}</p>
      <p className={styles.cartaoNome}>{conta.nome}</p>
      <p className={styles.cartaoDetalhe}>{conta.email}</p>
      <p className={styles.cartaoDetalhe}>
        {conta.cpf ? formatarCpf(conta.cpf) : "Sem CPF"} ·{" "}
        {conta.emailConfirmado ? "E-mail confirmado" : "E-mail não confirmado"}
      </p>
      <ul className={styles.vinculos}>
        <li>Inscrição no evento: {vinculos.inscricoesEdicao}</li>
        <li>Inscrições em atividades: {vinculos.inscricoesAtividade}</li>
        <li>Trabalhos submetidos: {vinculos.submissoes}</li>
        <li>Autorias de trabalhos: {vinculos.autorias}</li>
      </ul>
    </div>
  );
}

export default function UnificarContasForm({ aoConcluir, aoCancelar }) {
  const { notificar } = useToast();

  const [manter, setManter] = useState(null);
  const [remover, setRemover] = useState(null);
  const [previa, setPrevia] = useState(null);
  const [carregandoPrevia, setCarregandoPrevia] = useState(false);
  const [confirmarEmail, setConfirmarEmail] = useState(false);
  const [erroGeral, setErroGeral] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Sempre que as duas contas estão escolhidas, pede ao servidor a prévia
  // (o que vai mover, avisos e bloqueios) — a regra de o que pode ou não ser
  // unificado mora só no backend.
  useEffect(() => {
    setPrevia(null);
    setErroGeral("");

    if (!manter || !remover) return undefined;
    if (manter.id === remover.id) {
      setErroGeral("Escolha duas contas diferentes.");
      return undefined;
    }

    let cancelado = false;
    setCarregandoPrevia(true);

    apiClient
      .post("/usuarios/unificacao/previa", { manterId: manter.id, removerId: remover.id })
      .then((resposta) => {
        if (cancelado) return;
        setPrevia(resposta.previa);
        // Sem e-mail confirmado a pessoa não consegue fazer login, então já
        // vem marcado — o gestor pode desmarcar.
        setConfirmarEmail(!resposta.previa.manter.emailConfirmado);
      })
      .catch((erro) => {
        if (!cancelado) setErroGeral(erro.message);
      })
      .finally(() => {
        if (!cancelado) setCarregandoPrevia(false);
      });

    return () => {
      cancelado = true;
    };
  }, [manter, remover]);

  function inverter() {
    setManter(remover);
    setRemover(manter);
  }

  async function unificar() {
    setSalvando(true);

    try {
      const resposta = await apiClient.post("/usuarios/unificacao", {
        manterId: manter.id,
        removerId: remover.id,
        confirmarEmail: !previa.manter.emailConfirmado && confirmarEmail,
      });
      notificar("Contas unificadas com sucesso.");
      aoConcluir(resposta);
    } catch (erro) {
      notificar(erro.message, "erro");
      setErroGeral(erro.message);
    } finally {
      setSalvando(false);
      setConfirmando(false);
    }
  }

  const bloqueado = !previa || previa.bloqueios.length > 0;

  return (
    <div className={formStyles.formulario}>
      <p className={styles.explicacao}>
        Use quando a mesma pessoa ficou com duas contas. Inscrições e trabalhos submetidos da conta
        unificada passam para a conta que permanece, e a conta unificada é desativada.
      </p>

      <Alerta>{erroGeral}</Alerta>

      <BuscaUsuario
        id="busca-conta-manter"
        rotulo="Conta que permanece"
        usuarioSelecionado={manter}
        onSelecionar={setManter}
      />
      <BuscaUsuario
        id="busca-conta-remover"
        rotulo="Conta a ser unificada (será desativada)"
        usuarioSelecionado={remover}
        onSelecionar={setRemover}
      />

      {manter && remover && (
        <button type="button" className={styles.inverter} onClick={inverter}>
          Trocar qual conta permanece
        </button>
      )}

      {carregandoPrevia && <p className={styles.status}>Analisando as contas...</p>}

      {previa && (
        <>
          <div className={styles.cartoes}>
            <CartaoConta titulo="Permanece" conta={previa.manter} />
            <CartaoConta titulo="Será unificada" conta={previa.remover} />
          </div>

          {previa.bloqueios.length > 0 && (
            <ul className={styles.bloqueios}>
              {previa.bloqueios.map((bloqueio) => (
                <li key={bloqueio}>{bloqueio}</li>
              ))}
            </ul>
          )}

          {previa.bloqueios.length === 0 && previa.avisos.length > 0 && (
            <ul className={styles.avisos}>
              {previa.avisos.map((aviso) => (
                <li key={aviso}>{aviso}</li>
              ))}
            </ul>
          )}

          {!previa.manter.emailConfirmado && previa.bloqueios.length === 0 && (
            <label className={styles.opcao}>
              <input
                type="checkbox"
                checked={confirmarEmail}
                onChange={(evento) => setConfirmarEmail(evento.target.checked)}
              />
              <span>Marcar o e-mail da conta que permanece como confirmado</span>
            </label>
          )}
        </>
      )}

      <div className={formStyles.acoes}>
        <Botao type="button" variante="secundario" onClick={aoCancelar}>
          Cancelar
        </Botao>
        <Botao type="button" variante="perigo" disabled={bloqueado} onClick={() => setConfirmando(true)}>
          Unificar contas
        </Botao>
      </div>

      {confirmando && previa && (
        <ModalConfirmacao
          titulo="Unificar contas"
          mensagem={`Tudo de ${previa.remover.nome} (${previa.remover.email}) passará para ${previa.manter.nome} (${previa.manter.email}), e a conta ${previa.remover.email} será desativada. Essa ação não pode ser desfeita.`}
          rotuloConfirmar="Unificar"
          confirmando={salvando}
          onConfirmar={unificar}
          onCancelar={() => setConfirmando(false)}
        />
      )}
    </div>
  );
}
