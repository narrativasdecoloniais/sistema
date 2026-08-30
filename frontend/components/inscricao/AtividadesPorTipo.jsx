"use client";

import { useMemo } from "react";
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
  restricaoEscolhaUnica = true,
  estiloSlide,
}) {
  const tipos = useMemo(() => agruparPorTipo(grupo), [grupo]);
  const sufixoEscolhaUnica = restricaoEscolhaUnica ? " — só é possível escolher uma." : ".";

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

  return (
    <div className={styles.bloco}>
      <p className={styles.instrucao}>
        {restricaoEscolhaUnica
          ? `Neste horário há ${tipos.length} tipos de atividades — só é possível escolher uma.`
          : `Neste horário há ${tipos.length} tipos de atividades.`}
      </p>

      {tipos.map((tipo) => (
        <div key={tipo.id} className={styles.secaoTipo}>
          <h4 className={styles.tituloTipo}>{tipo.nome}</h4>
          {tipo.atividades.length === 1 ? (
            renderizarCartao(tipo.atividades[0])
          ) : (
            <CarrosselAtividades
              rotulo={`${tipo.atividades.length} atividades de "${tipo.nome}"${sufixoEscolhaUnica}`}
              estiloSlide={estiloSlide}
            >
              {tipo.atividades.map(renderizarCartao)}
            </CarrosselAtividades>
          )}
        </div>
      ))}
    </div>
  );
}
