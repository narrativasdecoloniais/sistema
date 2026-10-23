"use client";

import { useState } from "react";
import Botao from "@/components/forms/Botao";
import Alerta from "@/components/forms/Alerta";
import Modal from "./Modal";
import CampoRadioSecao from "./CampoRadioSecao";
import SeletorSecoesAdmin from "./SeletorSecoesAdmin";
import { useToast } from "./ToastProvider";
import { apiClient } from "@/lib/apiClient";
import styles from "./ParticipantesPainel.module.scss";

const OPCOES_PAPEL = [
  { valor: "ORGANIZADOR", rotulo: "Organizador(a)" },
  { valor: "ADMIN", rotulo: "Administrador(a)" },
];

const DESCRICOES_PAPEL = {
  ORGANIZADOR:
    "Acessa só as seções marcadas abaixo (ou todas, com acesso completo). Não gerencia a equipe nem vê a lista de todos os usuários.",
  ADMIN:
    "Acesso total ao Narrativas, inclusive aos dados de todos os usuários, aos e-mails em massa e à gestão da equipe.",
};

// Aba "Usuários" de Participantes: em vez de promover direto a
// administrador, escolhe o papel — organizador(a) com permissões por seção
// ou administrador(a). Para quem já é organizador, abre com as permissões
// atuais (salvar só as atualiza).
export default function ConcederAcessoModal({ usuario, permissoesAtuais, aoConcluir, aoCancelar }) {
  const { notificar } = useToast();
  const jaOrganizador = Boolean(permissoesAtuais);

  const [papel, setPapel] = useState("ORGANIZADOR");
  const [acessoCompleto, setAcessoCompleto] = useState(permissoesAtuais?.acessoCompleto ?? false);
  const [secoesPermitidas, setSecoesPermitidas] = useState(permissoesAtuais?.secoesPermitidas ?? []);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function conceder() {
    setErro("");
    if (papel === "ORGANIZADOR" && !acessoCompleto && secoesPermitidas.length === 0) {
      setErro("Marque pelo menos uma seção ou o acesso completo.");
      return;
    }

    setSalvando(true);
    try {
      const resposta =
        papel === "ADMIN"
          ? await apiClient.patch(`/organizadores/${usuario.id}/promover`, {})
          : await apiClient.patch(`/organizadores/${usuario.id}/organizador`, {
              acessoCompleto,
              secoesPermitidas,
            });
      notificar(
        papel === "ADMIN"
          ? `${resposta.organizador.nome} agora é administrador(a).`
          : jaOrganizador
            ? `Permissões de ${resposta.organizador.nome} atualizadas.`
            : `${resposta.organizador.nome} agora é organizador(a).`
      );
      aoConcluir(resposta.organizador);
    } catch (erroRequisicao) {
      notificar(erroRequisicao.message, "erro");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal titulo={`Dar acesso à gestão — ${usuario.nome}`} onFechar={aoCancelar}>
      <div className={styles.formPermissoes}>
        <Alerta>{erro}</Alerta>
        <CampoRadioSecao
          id="papel-acesso"
          rotulo="Papel na equipe"
          valor={papel}
          onChange={(valor) => {
            setPapel(valor);
            setErro("");
          }}
          opcoes={OPCOES_PAPEL}
        />
        <p className={styles.descricaoPapel}>{DESCRICOES_PAPEL[papel]}</p>

        {papel === "ORGANIZADOR" && (
          <SeletorSecoesAdmin
            acessoCompleto={acessoCompleto}
            secoesSelecionadas={secoesPermitidas}
            onAlterarAcessoCompleto={setAcessoCompleto}
            onAlterarSecoes={setSecoesPermitidas}
          />
        )}

        {/* Só atualizar permissões de quem já é organizador não manda e-mail. */}
        {(papel === "ADMIN" || !jaOrganizador) && (
          <p className={styles.descricaoPapel}>
            A pessoa recebe um e-mail avisando do acesso — ou um convite para concluir o cadastro,
            se a conta ainda não tiver CPF/documento.
          </p>
        )}

        <div className={styles.acoes}>
          <Botao type="button" variante="secundario" onClick={aoCancelar}>
            Cancelar
          </Botao>
          <Botao type="button" carregando={salvando} onClick={conceder}>
            {papel === "ADMIN"
              ? "Tornar administrador(a)"
              : jaOrganizador
                ? "Salvar permissões"
                : "Dar acesso"}
          </Botao>
        </div>
      </div>
    </Modal>
  );
}
