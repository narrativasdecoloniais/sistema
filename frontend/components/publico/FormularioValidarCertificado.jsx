"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Campo from "@/components/forms/Campo";
import Botao from "@/components/forms/Botao";
import { normalizarCodigoCertificado } from "@/lib/certificados";
import styles from "./FormularioValidarCertificado.module.scss";

// Digitação do código impresso no certificado (quem não leu o QR code).
export default function FormularioValidarCertificado({ codigoInicial = "" }) {
  const router = useRouter();
  const [codigo, setCodigo] = useState(codigoInicial);
  const [erro, setErro] = useState("");

  function validar(evento) {
    evento.preventDefault();
    const normalizado = normalizarCodigoCertificado(codigo);
    if (normalizado.replace(/-/g, "").length !== 12) {
      setErro("O código tem 12 letras e números, no formato XXXX-XXXX-XXXX.");
      return;
    }
    setErro("");
    router.push(`/validar-certificado/${normalizado}`);
  }

  return (
    <form className={styles.formulario} onSubmit={validar} noValidate>
      <Campo
        id="codigo-certificado"
        rotulo="Código de validação"
        value={codigo}
        onChange={(evento) => setCodigo(evento.target.value)}
        placeholder="XXXX-XXXX-XXXX"
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        maxLength={20}
        erro={erro}
      />
      <Botao type="submit">Validar</Botao>
    </form>
  );
}
