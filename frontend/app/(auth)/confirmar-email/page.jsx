"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import TelaAutenticacao from "@/components/publico/TelaAutenticacao";
import Alerta from "@/components/forms/Alerta";
import { apiClient } from "@/lib/apiClient";
import styles from "@/components/publico/TelaAutenticacao.module.scss";

function ConteudoConfirmacao() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [estado, setEstado] = useState("carregando");
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    if (!token) {
      setEstado("erro");
      setMensagem("Link de confirmação inválido.");
      return;
    }

    apiClient
      .get(`/auth/confirmar-email?token=${encodeURIComponent(token)}`)
      .then((resposta) => {
        setEstado("sucesso");
        setMensagem(resposta.mensagem);
      })
      .catch((erro) => {
        setEstado("erro");
        setMensagem(erro.message);
      });
  }, [token]);

  return (
    <>
      {estado === "carregando" && <p>Confirmando seu e-mail...</p>}
      {estado === "sucesso" && <Alerta tipo="sucesso">{mensagem}</Alerta>}
      {estado === "erro" && <Alerta>{mensagem}</Alerta>}
      <p className={styles.rodape}>
        <Link href="/login">Ir para o login</Link>
      </p>
    </>
  );
}

export default function PaginaConfirmarEmail() {
  return (
    <TelaAutenticacao eyebrow="Área do participante" titulo="Confirmação de e-mail">
      <Suspense fallback={<p>Carregando...</p>}>
        <ConteudoConfirmacao />
      </Suspense>
    </TelaAutenticacao>
  );
}
