"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { confirmarEntradaSubmissao, salvarSessaoSubmissao } from "@/lib/submissao";
import styles from "./page.module.scss";

// Destino de quem clica o link mágico enviado por
// enviarEmailEntrarSubmissao (backend/src/services/email.service.js) — troca
// o token de um-clique pelo Bearer de submissão e volta pra página do
// formulário de onde a pessoa veio.
function EntrarConteudo() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [estado, setEstado] = useState("verificando");

  useEffect(() => {
    const token = searchParams.get("token");
    const destino = searchParams.get("destino") || "/";

    if (!token) {
      setEstado("invalido");
      return;
    }

    let cancelado = false;

    async function confirmar() {
      try {
        const dados = await confirmarEntradaSubmissao(token);
        if (cancelado) return;
        salvarSessaoSubmissao(dados.token, dados.nome);
        router.replace(destino);
      } catch {
        if (!cancelado) setEstado("invalido");
      }
    }

    confirmar();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.pagina}>
      {estado === "verificando" && <p className={styles.instrucao}>Confirmando seu acesso...</p>}
      {estado === "invalido" && (
        <>
          <p className={styles.instrucao}>
            Esse link de acesso é inválido ou já expirou. Volte à página da modalidade e comece a
            submissão novamente.
          </p>
          <Link href="/" className={styles.link}>
            Voltar para a página inicial
          </Link>
        </>
      )}
    </div>
  );
}

export default function PaginaEntrarSubmissao() {
  return (
    <Suspense fallback={null}>
      <EntrarConteudo />
    </Suspense>
  );
}
