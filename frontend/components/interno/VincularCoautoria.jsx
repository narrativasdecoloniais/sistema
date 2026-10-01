"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Botao from "@/components/forms/Botao";
import Alerta from "@/components/forms/Alerta";
import { apiClient } from "@/lib/apiClient";
import { useToast } from "./ToastProvider";
import styles from "./SubmissoesParticipantePainel.module.scss";

// "Já tenho conta" do convite de coautor (/cadastro?convite=): o link prova
// o e-mail do convite e a sessão prova esta conta — os trabalhos daquele
// e-mail passam para cá.
export default function VincularCoautoria() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { notificar } = useToast();
  const token = searchParams.get("convite");
  const [vinculando, setVinculando] = useState(false);
  const [erro, setErro] = useState(token ? "" : "Link de convite inválido.");

  async function vincular() {
    setErro("");
    setVinculando(true);
    try {
      const { titulos } = await apiClient.post("/participante/coautorias/vincular", { token });
      notificar(
        titulos.length > 0
          ? `${titulos.length === 1 ? "Trabalho vinculado" : `${titulos.length} trabalhos vinculados`} à sua conta.`
          : "Convite aceito. Não havia trabalhos pendentes de vínculo."
      );
      router.push("/participante/submissoes");
    } catch (falha) {
      setErro(falha.message);
      notificar(falha.message, "erro");
    } finally {
      setVinculando(false);
    }
  }

  return (
    <div className={styles.pagina}>
      <div className={styles.cabecalho}>
        <div>
          <h1 className={styles.titulo}>Vincular trabalhos à sua conta</h1>
          <p className={styles.descricao}>
            Você abriu um convite de coautoria enviado para outro e-mail. Ao confirmar, os trabalhos em que esse e-mail
            consta como coautor passam a aparecer em &quot;Minhas submissões&quot; desta conta, e os avisos sobre eles
            passam a chegar no e-mail desta conta.
          </p>
        </div>
      </div>
      <Alerta>{erro}</Alerta>
      <div>
        <Botao type="button" onClick={vincular} carregando={vinculando} disabled={!token}>
          Vincular trabalhos
        </Botao>
      </div>
    </div>
  );
}
