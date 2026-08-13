"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { buscarAtividadePublicaPorSlug, formatarDiaAtividade, formatarFaixaHorario } from "@/lib/publico";
import CarrosselFacilitadores from "./CarrosselFacilitadores";
import styles from "./ModalDetalhesAtividade.module.scss";

const SELETOR_FOCAVEIS =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function agruparPorTipoParticipacao(pessoas) {
  const porTipo = new Map();
  for (const pessoa of pessoas) {
    const chave = pessoa.tipoParticipacao?.id ?? "sem-tipo";
    const rotulo = pessoa.tipoParticipacao?.nome ?? "Outros participantes";
    if (!porTipo.has(chave)) porTipo.set(chave, { rotulo, pessoas: [] });
    porTipo.get(chave).pessoas.push(pessoa);
  }
  return Array.from(porTipo.values());
}

// Mesmo padrão de acessibilidade de components/interno/Modal.jsx
// (focus trap, ESC fecha, clique no fundo fecha, trava scroll do body,
// devolve foco ao fechar). Renderizado via portal pra document.body porque
// este modal pode ser aberto a partir de um cartão dentro de um carrossel
// (CarrosselAtividades) — o container do carrossel recebe um `transform` do
// Embla, e um `position: fixed` descendente de um ancestral com transform
// deixa de ser relativo à viewport, quebrando o overlay em tela cheia.
export default function ModalDetalhesAtividade({ atividade, aoFechar }) {
  const painelRef = useRef(null);
  const idTitulo = useId();
  const idPessoas = useId();

  const [pessoas, setPessoas] = useState([]);
  const [carregandoPessoas, setCarregandoPessoas] = useState(true);

  useEffect(() => {
    let cancelado = false;

    async function buscarPessoas() {
      try {
        const dados = await buscarAtividadePublicaPorSlug(atividade.slug);
        if (!cancelado) setPessoas(dados?.pessoas || []);
      } catch {
        // Seção complementar — falha aqui não deve derrubar o modal.
      } finally {
        if (!cancelado) setCarregandoPessoas(false);
      }
    }

    buscarPessoas();
    return () => {
      cancelado = true;
    };
  }, [atividade.slug]);

  useEffect(() => {
    const elementoAnterior = document.activeElement;
    document.body.style.overflow = "hidden";

    const primeiroFocavel = painelRef.current?.querySelector(SELETOR_FOCAVEIS);
    primeiroFocavel?.focus();

    function aoPressionarTecla(evento) {
      if (evento.key === "Escape") {
        aoFechar();
        return;
      }

      if (evento.key === "Tab" && painelRef.current) {
        const focaveis = painelRef.current.querySelectorAll(SELETOR_FOCAVEIS);
        if (focaveis.length === 0) return;

        const primeiro = focaveis[0];
        const ultimo = focaveis[focaveis.length - 1];

        if (evento.shiftKey && document.activeElement === primeiro) {
          evento.preventDefault();
          ultimo.focus();
        } else if (!evento.shiftKey && document.activeElement === ultimo) {
          evento.preventDefault();
          primeiro.focus();
        }
      }
    }

    document.addEventListener("keydown", aoPressionarTecla);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", aoPressionarTecla);
      elementoAnterior?.focus?.();
    };
  }, [aoFechar]);

  function aoClicarFundo(evento) {
    if (evento.target === evento.currentTarget) {
      aoFechar();
    }
  }

  function renderizarPessoa(pessoa) {
    return (
      <div className={styles.pessoaCartao} key={pessoa.id}>
        <div className={styles.pessoaFoto} aria-hidden={pessoa.imagem ? undefined : "true"}>
          {pessoa.imagem ? (
            <img src={pessoa.imagem} alt="" className={styles.pessoaImagem} />
          ) : (
            <span className={styles.pessoaInicial}>{pessoa.nome.trim().charAt(0)}</span>
          )}
        </div>
        <p className={styles.pessoaNome}>{pessoa.nome}</p>
        {pessoa.breveDescricao && <p className={styles.pessoaDescricao}>{pessoa.breveDescricao}</p>}
        {pessoa.descricao && <p className={styles.pessoaDescricao}>{pessoa.descricao}</p>}
      </div>
    );
  }

  const meta = [atividade.local, atividade.cargaHoraria ? `${atividade.cargaHoraria}h` : null]
    .filter(Boolean)
    .join(" · ");

  const mesmoDia =
    new Date(atividade.inicioAtividade).toISOString().slice(0, 10) ===
    new Date(atividade.fimAtividade).toISOString().slice(0, 10);
  const rotuloDia = mesmoDia
    ? formatarDiaAtividade(atividade.inicioAtividade).completo
    : `${formatarDiaAtividade(atividade.inicioAtividade).completo} até ${formatarDiaAtividade(atividade.fimAtividade).completo}`;
  const rotuloPeriodo = formatarFaixaHorario(atividade.inicioAtividade, atividade.fimAtividade);

  const estadoVagas = !atividade.exigeInscricao
    ? "Sem inscrição necessária"
    : atividade.semLimiteVagas
      ? "Vagas ilimitadas"
      : atividade.lotada
        ? "Lotada — você entrará na lista de espera"
        : `${atividade.vagasRestantes} vagas restantes`;

  const grupos = agruparPorTipoParticipacao(pessoas);

  return createPortal(
    <div className={styles.fundo} onClick={aoClicarFundo}>
      <div
        className={styles.painel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        ref={painelRef}
      >
        <div className={styles.cabecalho}>
          <div className={styles.tituloBloco}>
            <span className={styles.eyebrow}>{atividade.tipoAtividade.nome}</span>
            <h2 id={idTitulo} className={`${styles.titulo} stencil`}>
              {atividade.nome}
            </h2>
          </div>
          <button type="button" className={styles.fechar} onClick={aoFechar} aria-label="Fechar">
            ×
          </button>
        </div>

        <div className={styles.conteudo}>
          <div className={styles.metaBloco}>
            <p className={styles.metaLinha}>
              <span className={styles.metaRotulo}>Dia:</span> {rotuloDia}
            </p>
            <p className={styles.metaLinha}>
              <span className={styles.metaRotulo}>Período:</span> {rotuloPeriodo}
            </p>
            {meta && <p className={styles.metaLinha}>{meta}</p>}
            <p className={`${styles.metaLinha} ${styles.metaVagas}`}>{estadoVagas}</p>
          </div>

          {atividade.descricao && (
            <section>
              <h3 className={styles.subtitulo}>Sobre a atividade</h3>
              <p className={styles.descricao}>{atividade.descricao}</p>
            </section>
          )}

          {carregandoPessoas && (
            <p className={styles.carregandoPessoas}>Carregando participantes...</p>
          )}

          {!carregandoPessoas &&
            grupos.map((grupo, indice) => {
              const idGrupo = `${idPessoas}-${indice}`;
              return (
                <section key={idGrupo} aria-labelledby={idGrupo} className={styles.secaoPessoas}>
                  <h3 id={idGrupo} className={styles.subtitulo}>
                    {grupo.rotulo}
                  </h3>
                  {grupo.pessoas.length === 1 ? (
                    <div className={styles.pessoaUnica}>{renderizarPessoa(grupo.pessoas[0])}</div>
                  ) : (
                    <CarrosselFacilitadores>
                      {grupo.pessoas.map(renderizarPessoa)}
                    </CarrosselFacilitadores>
                  )}
                </section>
              );
            })}
        </div>
      </div>
    </div>,
    document.body
  );
}
