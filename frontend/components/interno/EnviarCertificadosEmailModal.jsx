"use client";

import { useMemo, useState } from "react";
import Botao from "@/components/forms/Botao";
import Modal from "./Modal";
import CampoCheckbox from "./CampoCheckbox";
import { useToast } from "./ToastProvider";
import { ROTULOS_TIPO_CERTIFICADO, certificadosAdmin } from "@/lib/certificados";
import styles from "./AvaliacaoSubmissoesPainel.module.scss";
import estilos from "./CertificadosPainel.module.scss";

// Envio dos certificados por e-mail (link da validação pública, com o botão do
// PDF). Por grupos — os tipos liberados, todos ou só alguns — ou só os
// certificados selecionados na tabela (idsSelecionados). Mesma regra do
// backend (certificados.service.js#solicitarEnvioEmail): só certificado válido,
// de tipo liberado e com e-mail; sem "reenviar", só quem ainda não recebeu.
export default function EnviarCertificadosEmailModal({ edicaoId, dados, idsSelecionados, onFechar, onEnviado }) {
  const { notificar } = useToast();
  const tiposLiberados = dados.tipos.map((t) => t.tipo).filter((tipo) => dados.modelos[tipo].liberadoEm);
  const [tipos, setTipos] = useState(tiposLiberados);
  const [reenviar, setReenviar] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const selecionados = idsSelecionados ? new Set(idsSelecionados) : null;

  // Por tipo: quantos sairiam agora e quantos ficam de fora (já enviados / sem e-mail).
  const contagem = useMemo(() => {
    const porTipo = {};
    for (const c of dados.certificados) {
      if (selecionados && !selecionados.has(c.id)) continue;
      const atual = (porTipo[c.tipo] ||= { enviar: 0, jaEnviados: 0, semEmail: 0 });
      if (c.revogadoEm || !c.liberado) continue;
      if (!c.email) atual.semEmail += 1;
      else if (c.situacaoEmail === "ENVIADO" && !reenviar) atual.jaEnviados += 1;
      else atual.enviar += 1;
    }
    return porTipo;
  }, [dados.certificados, selecionados, reenviar]);

  const tiposConsiderados = selecionados ? tiposLiberados : tipos;
  const total = tiposConsiderados.reduce((soma, tipo) => soma + (contagem[tipo]?.enviar || 0), 0);
  const naoLiberadosSelecionados = selecionados
    ? dados.certificados.filter((c) => selecionados.has(c.id) && !c.revogadoEm && !c.liberado).length
    : 0;

  function alternarTipo(tipo, marcado) {
    setTipos((atual) => (marcado ? [...atual, tipo] : atual.filter((t) => t !== tipo)));
  }

  async function enviar() {
    setEnviando(true);
    try {
      const resposta = await certificadosAdmin.enviarPorEmail(
        edicaoId,
        selecionados ? { ids: [...selecionados], reenviar } : { tipos, reenviar }
      );
      notificar(resposta.mensagem);
      onEnviado();
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setEnviando(false);
    }
  }

  const descreverTipo = (tipo) => {
    const c = contagem[tipo] || { enviar: 0, jaEnviados: 0, semEmail: 0 };
    const extras = [
      c.jaEnviados > 0 ? `${c.jaEnviados} já ${c.jaEnviados === 1 ? "recebeu" : "receberam"}` : null,
      c.semEmail > 0 ? `${c.semEmail} sem e-mail` : null,
    ].filter(Boolean);
    return `${ROTULOS_TIPO_CERTIFICADO[tipo]} — ${c.enviar} a enviar${extras.length ? ` (${extras.join(", ")})` : ""}`;
  };

  return (
    <Modal titulo="Enviar certificados por e-mail" onFechar={onFechar}>
      <div className={styles.formulario}>
        <p className={styles.textoApoio}>
          Cada pessoa recebe um e-mail com o link do certificado, onde confere a validade e baixa o PDF, sem precisar
          de conta. O envio roda em segundo plano, um e-mail por vez.
        </p>

        {tiposLiberados.length === 0 ? (
          <p className={styles.aviso}>
            Nenhum tipo de certificado está liberado. Libere o tipo nos cartões acima antes de enviar.
          </p>
        ) : selecionados ? (
          <>
            <p className={styles.textoApoio}>
              <strong>{idsSelecionados.length}</strong>{" "}
              {idsSelecionados.length === 1 ? "certificado selecionado" : "certificados selecionados"}:
            </p>
            <ul className={`${styles.textoApoio} ${estilos.listaEnvio}`}>
              {tiposLiberados
                .filter((tipo) => contagem[tipo])
                .map((tipo) => (
                  <li key={tipo}>{descreverTipo(tipo)}</li>
                ))}
            </ul>
            {naoLiberadosSelecionados > 0 && (
              <p className={styles.textoApoio}>
                {naoLiberadosSelecionados} de tipo ainda não liberado {naoLiberadosSelecionados === 1 ? "fica" : "ficam"} de
                fora.
              </p>
            )}
          </>
        ) : (
          <fieldset className={estilos.grupoEnvio}>
            <legend className={styles.textoApoio}>Quais grupos recebem:</legend>
            {tiposLiberados.map((tipo) => (
              <CampoCheckbox
                key={tipo}
                id={`enviar-tipo-${tipo}`}
                rotulo={descreverTipo(tipo)}
                checked={tipos.includes(tipo)}
                onChange={(marcado) => alternarTipo(tipo, marcado)}
              />
            ))}
            {dados.tipos.length > tiposLiberados.length && (
              <p className={styles.textoApoio}>
                Tipos não liberados não aparecem aqui:{" "}
                {dados.tipos
                  .filter((t) => !tiposLiberados.includes(t.tipo))
                  .map((t) => t.rotulo)
                  .join(", ")}
                .
              </p>
            )}
          </fieldset>
        )}

        {tiposLiberados.length > 0 && (
          <CampoCheckbox
            id="enviar-reenviar"
            rotulo="Reenviar também para quem já recebeu"
            checked={reenviar}
            onChange={setReenviar}
          />
        )}

        <div className={styles.acoesFormulario}>
          <Botao type="button" variante="secundario" onClick={onFechar}>
            Cancelar
          </Botao>
          <Botao type="button" carregando={enviando} disabled={total === 0} onClick={enviar}>
            {total === 0 ? "Nada a enviar" : `Enviar ${total} ${total === 1 ? "e-mail" : "e-mails"}`}
          </Botao>
        </div>
      </div>
    </Modal>
  );
}
