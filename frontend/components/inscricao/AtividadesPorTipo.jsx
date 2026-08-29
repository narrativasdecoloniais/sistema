"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import CarrosselAtividades from "./CarrosselAtividades";
import styles from "./AtividadesPorTipo.module.scss";

// Agrupa por tipoAtividade preservando a ordem de `grupo` — o array já vem
// ordenado do jeito que interessa pra cada tela que usa este componente
// (por horário de início em agruparAtividadesSimultaneas na inscrição, por
// nome do tipo em agruparAtividadesPorHorarioInicio na Programação), então
// não precisa reordenar aqui.
function agruparPorTipo(grupo) {
  const porTipo = new Map();

  for (const atividade of grupo) {
    const chave = atividade.tipoAtividade.id;
    if (!porTipo.has(chave)) {
      porTipo.set(chave, { id: chave, nome: atividade.tipoAtividade.nome, atividades: [] });
    }
    porTipo.get(chave).atividades.push(atividade);
  }

  return Array.from(porTipo.values());
}

// `restricaoEscolhaUnica` distingue os dois usos deste componente: no fluxo
// de inscrição (checkbox, uma atividade por horário) o texto reforça a
// restrição; na Programação pública (`PaginaInicialConteudo.jsx`, só
// leitura, sem seleção) ela não existe, então o texto fica sem essa parte.
export default function AtividadesPorTipo({
  grupo,
  renderizarCartao,
  selecionadas = new Set(),
  restricaoEscolhaUnica = true,
  estiloSlide,
}) {
  const tipos = useMemo(() => agruparPorTipo(grupo), [grupo]);
  const sufixoEscolhaUnica = restricaoEscolhaUnica ? " — só é possível escolher uma." : ".";
  const reduzMovimento = useReducedMotion();

  // Inicializador preguiçoso: abre direto o tipo que já tem uma atividade
  // selecionada (ex. voltando pra essa etapa em "adicionar mais
  // atividades"); não reage a seleções feitas depois do mount, senão o
  // clique da própria pessoa nesse componente seria sobrescrito.
  const [tipoAtivoId, setTipoAtivoId] = useState(() => {
    const tipoComSelecao = tipos.find((tipo) =>
      tipo.atividades.some((atividade) => selecionadas.has(atividade.id))
    );
    return tipoComSelecao?.id ?? null;
  });

  if (tipos.length === 1) {
    return grupo.length === 1 ? (
      renderizarCartao(grupo[0])
    ) : (
      <CarrosselAtividades
        rotulo={`${grupo.length} atividades no mesmo horário${sufixoEscolhaUnica}`}
        estiloSlide={estiloSlide}
      >
        {grupo.map(renderizarCartao)}
      </CarrosselAtividades>
    );
  }

  const tipoAtivo = tipos.find((tipo) => tipo.id === tipoAtivoId) ?? null;

  // Amortecimento ~0,6 (abaixo de 1 = criticamente amortecido): passa um
  // pouco do ponto final e assenta suave, um único quique, sem oscilar.
  // Preferido a `bounce`+`duration` (atalho do Motion, menos previsível)
  // pra controlar a física da mola com precisão.
  const variantesConteudo = {
    entrar: {
      opacity: 1,
      y: 0,
      transition: reduzMovimento
        ? { duration: 0 }
        : { type: "spring", stiffness: 300, damping: 22, mass: 1 },
    },
    sair: {
      opacity: 0,
      transition: reduzMovimento ? { duration: 0 } : { duration: 0.15, ease: "easeIn" },
    },
  };

  return (
    <div className={styles.bloco}>
      <p className={styles.instrucao}>
        {restricaoEscolhaUnica
          ? `Neste horário há ${tipos.length} tipos de atividades. Só é possível escolher uma — clique em um tipo para ver as opções.`
          : `Neste horário há ${tipos.length} tipos de atividades. Clique em um tipo para ver as opções.`}
      </p>

      <div className={styles.chips} role="group" aria-label="Tipos de atividade neste horário">
        {tipos.map((tipo) => {
          const ativo = tipo.id === tipoAtivoId;
          return (
            <motion.button
              key={tipo.id}
              type="button"
              className={`${styles.chip} ${ativo ? styles.chipAtivo : ""}`}
              aria-pressed={ativo}
              onClick={() => setTipoAtivoId(ativo ? null : tipo.id)}
              whileTap={reduzMovimento ? undefined : { scale: 0.95 }}
            >
              {tipo.nome}
              {tipo.atividades.length > 1 && (
                <span className={styles.contagem}>{tipo.atividades.length}</span>
              )}
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence mode="popLayout">
        {tipoAtivo && (
          <motion.div
            key={tipoAtivo.id}
            initial={reduzMovimento ? false : { opacity: 0, y: -10 }}
            animate="entrar"
            exit="sair"
            variants={variantesConteudo}
          >
            {tipoAtivo.atividades.length === 1 ? (
              renderizarCartao(tipoAtivo.atividades[0])
            ) : (
              <CarrosselAtividades
                rotulo={`${tipoAtivo.atividades.length} atividades de "${tipoAtivo.nome}"${sufixoEscolhaUnica}`}
                estiloSlide={estiloSlide}
              >
                {tipoAtivo.atividades.map(renderizarCartao)}
              </CarrosselAtividades>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
