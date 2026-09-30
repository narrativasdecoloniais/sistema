"use client";

import { useState } from "react";
import ModeloCertificadoForm, { formDoModelo } from "./ModeloCertificadoForm";
import CertificadosEmitidosAba from "./CertificadosEmitidosAba";
import { useToast } from "./ToastProvider";
import { certificadosAdmin } from "@/lib/certificados";
import styles from "./AvaliacaoSubmissoesPainel.module.scss";
import estilos from "./CertificadosPainel.module.scss";

const iguais = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Tela de Certificados da edição (seção CERTIFICADOS): um modelo por tipo
// (aba Modelos) e a emissão/liberação/revogação (aba Emitidos) — ver
// backend/src/services/certificados.service.js.
export default function CertificadosPainel({ edicaoId, dadosIniciais }) {
  const { notificar } = useToast();
  const [dados, setDados] = useState(dadosIniciais);
  const [abaAtiva, setAbaAtiva] = useState("modelos");
  const [tipoAtivo, setTipoAtivo] = useState(dadosIniciais?.tipos[0]?.tipo);
  // Rascunho de cada tipo — trocar de tipo não perde o que foi editado.
  const [rascunhos, setRascunhos] = useState(() =>
    dadosIniciais
      ? Object.fromEntries(Object.entries(dadosIniciais.modelos).map(([tipo, modelo]) => [tipo, formDoModelo(modelo)]))
      : {}
  );

  if (!dados) {
    return (
      <div className={styles.vazio}>
        <p>Não foi possível carregar os certificados.</p>
        <p className={styles.vazioApoio}>Recarregue a página para tentar de novo.</p>
      </div>
    );
  }

  async function recarregar() {
    try {
      setDados(await certificadosAdmin.listar(edicaoId));
    } catch (erro) {
      notificar(erro.message, "erro");
    }
  }

  function aoSalvarModelo(tipo, modelo) {
    setDados((atual) => ({ ...atual, modelos: { ...atual.modelos, [tipo]: modelo } }));
    setRascunhos((atual) => ({ ...atual, [tipo]: formDoModelo(modelo) }));
    recarregar();
  }

  const alterado = (tipo) => !iguais(rascunhos[tipo], formDoModelo(dados.modelos[tipo]));

  return (
    <div className={styles.pagina}>
      <div className={styles.cabecalho}>
        <div>
          <h1 className={styles.titulo}>Certificados</h1>
          <p className={styles.descricao}>
            Configure o modelo de cada tipo de certificado, gere os certificados de quem tem direito e libere o
            download na área do participante. Cada certificado tem um QR code que leva à validação pública.
          </p>
        </div>
      </div>

      <div className={styles.abas} role="tablist" aria-label="Seções dos certificados">
        {[
          { chave: "modelos", rotulo: "Modelos" },
          { chave: "emitidos", rotulo: `Emitidos (${dados.certificados.length})` },
        ].map((aba) => (
          <button
            key={aba.chave}
            type="button"
            role="tab"
            aria-selected={abaAtiva === aba.chave}
            tabIndex={abaAtiva === aba.chave ? 0 : -1}
            className={`${styles.aba} ${abaAtiva === aba.chave ? styles.abaAtiva : ""}`}
            onClick={() => setAbaAtiva(aba.chave)}
          >
            {aba.rotulo}
          </button>
        ))}
      </div>

      {abaAtiva === "modelos" ? (
        <>
          <div className={estilos.seletorTipos} role="group" aria-label="Tipo de certificado">
            {dados.tipos.map(({ tipo, rotulo }) => (
              <button
                key={tipo}
                type="button"
                aria-pressed={tipoAtivo === tipo}
                className={`${estilos.opcaoTipo} ${tipoAtivo === tipo ? estilos.opcaoTipoAtiva : ""}`}
                onClick={() => setTipoAtivo(tipo)}
              >
                {rotulo}
                {alterado(tipo) && (
                  <span className={estilos.indicadorAlterado} aria-label="(alterações não salvas)">
                    •
                  </span>
                )}
              </button>
            ))}
          </div>

          <ModeloCertificadoForm
            key={tipoAtivo}
            edicaoId={edicaoId}
            tipo={tipoAtivo}
            form={rascunhos[tipoAtivo]}
            alterarForm={(novo) => setRascunhos((atual) => ({ ...atual, [tipoAtivo]: novo }))}
            modeloSalvo={dados.modelos[tipoAtivo]}
            alterado={alterado(tipoAtivo)}
            marcadores={dados.marcadores[tipoAtivo]}
            exemplo={dados.exemplos[tipoAtivo]}
            outrosTipos={dados.tipos
              .filter(({ tipo }) => tipo !== tipoAtivo)
              .map(({ tipo, rotulo }) => ({ tipo, rotulo, form: rascunhos[tipo] }))}
            aoSalvar={(modelo) => aoSalvarModelo(tipoAtivo, modelo)}
          />
        </>
      ) : (
        <CertificadosEmitidosAba edicaoId={edicaoId} dados={dados} recarregar={recarregar} />
      )}
    </div>
  );
}
