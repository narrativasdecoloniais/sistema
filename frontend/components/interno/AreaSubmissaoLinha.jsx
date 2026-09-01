"use client";

import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import CampoTexto from "./CampoTexto";
import CampoArea from "./CampoArea";
import CampoMultiSelect from "./CampoMultiSelect";
import styles from "./AtividadeForm.module.scss";
import multiSelectStyles from "./CampoMultiSelect.module.scss";

// Erros vêm do form pai com caminho pontilhado completo (ex. "areas.2.titulo")
// — recorta pro prefixo desta área antes de repassar pros campos, que só
// conhecem o próprio nome.
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
  atividadesDisponiveis,
  outrasAreas,
  aoAlternarExpandir,
  aoMudarCampo,
  aoMover,
  aoRemover,
}) {
  const errosArea = escoparErros(erros, `areas.${indiceFlat}.`);
  const tituloExibicao = area.titulo || "Nova área";
  const atividadeIds = area.atividadeIds || [];

  const atividadesOrdenadas = [...(atividadesDisponiveis || [])].sort((a, b) =>
    a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" })
  );

  // Uma atividade só pode pertencer a uma área — se já estiver marcada numa
  // área irmã deste mesmo formulário, ou já vinculada no banco a outra área,
  // o item fica desabilitado aqui até ser desmarcada na origem (evita
  // "roubar" o vínculo silenciosamente ao salvar).
  function ocupacaoExterna(atividade) {
    const areaIrma = (outrasAreas || []).find(
      (outra, indice) => indice !== indiceFlat && (outra.atividadeIds || []).includes(atividade.id)
    );
    if (areaIrma) {
      return { titulo: areaIrma.titulo || "Nova área" };
    }

    if (atividade.areaSubmissao && atividade.areaSubmissao.id !== area.id) {
      return {
        titulo: atividade.areaSubmissao.titulo,
        modalidade: atividade.areaSubmissao.modalidadeSubmissao?.nome,
      };
    }

    return null;
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

          <CampoMultiSelect
            id={`area-atividades-${indiceFlat}`}
            rotulo="Atividades vinculadas"
            value={atividadeIds}
            onChange={(novosIds) => aoMudarCampo("atividadeIds", novosIds)}
            options={atividadesOrdenadas}
            optionDisabled={(atividade) => Boolean(ocupacaoExterna(atividade))}
            placeholder="Selecionar atividades"
            filterPlaceholder="Buscar atividade..."
            vazio="Nenhuma atividade cadastrada nesta edição ainda."
            vazioFiltro="Nenhuma atividade encontrada."
            itemTemplate={(atividade) => {
              const ocupacao = ocupacaoExterna(atividade);
              return (
                <div className={multiSelectStyles.itemConteudo}>
                  <span className={multiSelectStyles.itemRotulo}>{atividade.nome}</span>
                  {ocupacao && (
                    <span className={multiSelectStyles.itemLegenda}>
                      Já vinculada a {ocupacao.titulo}
                      {ocupacao.modalidade ? ` — ${ocupacao.modalidade}` : ""}
                    </span>
                  )}
                </div>
              );
            }}
          />

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
