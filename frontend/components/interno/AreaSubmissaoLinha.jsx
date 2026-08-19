"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import CampoTexto from "./CampoTexto";
import CampoArea from "./CampoArea";
import { Button } from "primereact/button";
import PessoaAreaLinha from "./PessoaAreaLinha";
import styles from "./AtividadeForm.module.scss";

const GRUPOS_PAPEL = [
  { valor: "COORDENACAO", rotulo: "Coordenação" },
  { valor: "CONVIDADO", rotulo: "Convidadas e convidados especiais" },
];

// Duas seções fixas (não dinâmicas por catálogo, ao contrário do tipo de
// participação de AtividadePessoa) — a ordem publicada é sempre Coordenação
// antes de Convidados, então a listagem do admin replica essa ordem fixa em
// vez de agrupar pela ordem de aparecimento no array.
function agruparPessoasPorPapel(pessoas) {
  return GRUPOS_PAPEL.map(({ valor, rotulo }) => ({
    chave: valor,
    rotulo,
    itens: pessoas
      .map((pessoa, indiceFlat) => ({ pessoa, indiceFlat }))
      .filter(({ pessoa }) => pessoa.papel === valor),
  }));
}

// Erros vêm do form pai com caminho pontilhado completo (ex.
// "areas.2.pessoas.0.nome") — recorta pro prefixo desta área/pessoa antes
// de repassar pros componentes filhos, que só conhecem o próprio campo.
function escoparErros(erros, prefixo) {
  const escopado = {};
  for (const [chave, valor] of Object.entries(erros)) {
    if (chave.startsWith(prefixo)) escopado[chave.slice(prefixo.length)] = valor;
  }
  return escopado;
}

export default function AreaSubmissaoLinha({
  area,
  indiceFlat,
  expandida,
  podeSubir,
  podeDescer,
  erros,
  aoAlternarExpandir,
  aoMudarCampo,
  aoMover,
  aoRemover,
}) {
  const [pessoaExpandidaId, setPessoaExpandidaId] = useState(null);

  const prefixo = `areas.${indiceFlat}.`;
  const errosArea = escoparErros(erros, prefixo);
  const errosPessoas = escoparErros(erros, `${prefixo}pessoas.`);
  const pessoas = area.pessoas || [];
  const gruposPessoas = agruparPessoasPorPapel(pessoas);
  const tituloExibicao = area.titulo || "Nova área";

  function aoMudarPessoa(indice, campo, valor) {
    const novasPessoas = [...pessoas];
    novasPessoas[indice] = { ...novasPessoas[indice], [campo]: valor };
    aoMudarCampo("pessoas", novasPessoas);
  }

  function aoAdicionarPessoa() {
    const localId = crypto.randomUUID();
    aoMudarCampo("pessoas", [...pessoas, { localId, nome: "", afiliacao: "", papel: "COORDENACAO" }]);
    setPessoaExpandidaId(localId);
  }

  function aoRemoverPessoa(indice) {
    const localId = pessoas[indice]?.localId;
    aoMudarCampo("pessoas", pessoas.filter((_, i) => i !== indice));
    setPessoaExpandidaId((atual) => (atual === localId ? null : atual));
  }

  function aoAlternarExpandirPessoa(localId) {
    setPessoaExpandidaId((atual) => (atual === localId ? null : localId));
  }

  // Mesmo algoritmo de troca-dentro-do-grupo já usado pra pessoas de
  // atividade (AtividadeForm.jsx) — só troca as duas pessoas do mesmo
  // papel, sem afetar a posição de quem tem o outro papel.
  function moverPessoa(localId, direcao) {
    const indiceAtual = pessoas.findIndex((pessoa) => pessoa.localId === localId);
    if (indiceAtual === -1) return;

    const papel = pessoas[indiceAtual].papel;
    const indicesGrupo = [];
    pessoas.forEach((pessoa, indice) => {
      if (pessoa.papel === papel) indicesGrupo.push(indice);
    });

    const posicaoGrupo = indicesGrupo.indexOf(indiceAtual);
    const posicaoAlvo = posicaoGrupo + direcao;
    if (posicaoAlvo < 0 || posicaoAlvo >= indicesGrupo.length) return;

    const indiceAlvo = indicesGrupo[posicaoAlvo];
    const novasPessoas = [...pessoas];
    [novasPessoas[indiceAtual], novasPessoas[indiceAlvo]] = [novasPessoas[indiceAlvo], novasPessoas[indiceAtual]];
    aoMudarCampo("pessoas", novasPessoas);
  }

  return (
    <div className={styles.linhaPessoa}>
      <div className={styles.cabecalhoPessoa}>
        <div className={styles.controlesReordenar}>
          <button
            type="button"
            className={styles.botaoReordenar}
            onClick={() => aoMover(-1)}
            disabled={!podeSubir}
            aria-label={`Mover ${tituloExibicao} para cima`}
          >
            <ChevronUp size={16} strokeWidth={1.5} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={styles.botaoReordenar}
            onClick={() => aoMover(1)}
            disabled={!podeDescer}
            aria-label={`Mover ${tituloExibicao} para baixo`}
          >
            <ChevronDown size={16} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>
        <button
          type="button"
          className={styles.resumoPessoa}
          onClick={aoAlternarExpandir}
          aria-expanded={expandida}
        >
          <span className={styles.textoResumo}>
            <span className={styles.nomeResumo}>{tituloExibicao}</span>
            <span className={styles.descricaoResumo}>
              {pessoas.length} {pessoas.length === 1 ? "pessoa" : "pessoas"}
            </span>
          </span>
        </button>
      </div>
      {expandida && (
        <div className={styles.corpoExpandido}>
          <CampoTexto
            id={`area-titulo-${indiceFlat}`}
            rotulo="Título"
            value={area.titulo}
            onChange={(evento) => aoMudarCampo("titulo", evento.target.value)}
            erro={errosArea.titulo}
          />
          <CampoTexto
            id={`area-slug-${indiceFlat}`}
            rotulo="Slug"
            value={area.slug}
            onChange={(evento) => aoMudarCampo("slug", evento.target.value)}
            erro={errosArea.slug}
          />
          <CampoArea
            id={`area-descricao-${indiceFlat}`}
            rotulo="Descrição (opcional)"
            linhas={4}
            value={area.descricao}
            onChange={(evento) => aoMudarCampo("descricao", evento.target.value)}
            erro={errosArea.descricao}
          />

          <div className={styles.secaoPessoas}>
            <span className={styles.rotuloLista}>Pessoas</span>
            {gruposPessoas.map(
              (grupo) =>
                grupo.itens.length > 0 && (
                  <div key={grupo.chave} className={styles.grupoPessoas}>
                    <span className={styles.tituloGrupo}>{grupo.rotulo}</span>
                    {grupo.itens.map(({ pessoa, indiceFlat: indicePessoa }, posicaoGrupo) => (
                      <PessoaAreaLinha
                        key={pessoa.localId}
                        pessoa={pessoa}
                        indiceFlat={indicePessoa}
                        expandida={pessoaExpandidaId === pessoa.localId}
                        podeSubir={posicaoGrupo > 0}
                        podeDescer={posicaoGrupo < grupo.itens.length - 1}
                        erros={escoparErros(errosPessoas, `${indicePessoa}.`)}
                        aoAlternarExpandir={() => aoAlternarExpandirPessoa(pessoa.localId)}
                        aoMudarCampo={(campo, valor) => aoMudarPessoa(indicePessoa, campo, valor)}
                        aoMover={(direcao) => moverPessoa(pessoa.localId, direcao)}
                        aoRemover={() => aoRemoverPessoa(indicePessoa)}
                      />
                    ))}
                  </div>
                )
            )}
            <Button
              type="button"
              label="Adicionar pessoa"
              onClick={aoAdicionarPessoa}
              pt={{ root: { className: styles.botaoSecundario } }}
            />
          </div>

          <button
            type="button"
            className={styles.botaoRemoverPessoa}
            onClick={aoRemover}
            aria-label="Remover área"
          >
            <Trash2 size={16} strokeWidth={1.5} aria-hidden="true" />
            Remover área
          </button>
        </div>
      )}
    </div>
  );
}
