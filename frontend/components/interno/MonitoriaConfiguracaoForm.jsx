"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, CalendarCheck, CheckSquare, FileText, ListChecks, Plus, Trash2 } from "lucide-react";
import Botao from "@/components/forms/Botao";
import CampoRichText from "@/components/forms/CampoRichText";
import CabecalhoSecao from "./CabecalhoSecao";
import CampoTexto from "./CampoTexto";
import CampoCorSecao, { OPCOES_COR_PUBLICA } from "./CampoCorSecao";
import { useToast } from "./ToastProvider";
import { paraData, paraHora, combinar } from "@/lib/dataHoraIngenua";
import { contraste } from "@/lib/contraste";
import { resolverCorHex } from "@/lib/cores";
import { configuracaoMonitoriaSchema, extrairErros } from "@/lib/validacao";
import { FUNCOES_MONITORIA_PADRAO, TEXTOS_CIENTE_MONITORIA_PADRAO, salvarConfiguracaoMonitoria } from "@/lib/monitoria";
import styles from "./EdicaoForm.module.scss";
import estilosTabela from "./AvaliacaoSubmissoesPainel.module.scss";
import estilos from "./MonitoriaPainel.module.scss";

// Padrão do selo de destaque quando a edição ainda não escolheu cores.
const COR_FUNDO_DESTAQUE_PADRAO = "BARRO";
const COR_TEXTO_DESTAQUE_PADRAO = "PAPEL";
const LIMIAR_CONTRASTE_TEXTO = 4.5;

// Configurações da chamada de monitoria da edição: período de inscrição
// (mesma convenção de data/hora "ingênua" das inscrições do evento), vagas
// (só informativo), funções que o candidato escolhe e o texto do edital
// mostrado na página pública /monitoria e os textos dos 3 "Estou ciente de
// que" do formulário. Salva tudo num PATCH só.
export default function MonitoriaConfiguracaoForm({ edicaoId, edicao, aoSalvar }) {
  const { notificar } = useToast();
  const [inicio, setInicio] = useState(edicao.inicioInscricoesMonitoria || "");
  const [fim, setFim] = useState(edicao.fimInscricoesMonitoria || "");
  const [vagas, setVagas] = useState(edicao.vagasMonitoria ? String(edicao.vagasMonitoria) : "");
  // Lista vazia vem pré-preenchida com as funções do edital da V edição.
  const [funcoes, setFuncoes] = useState(
    edicao.funcoesMonitoria.length > 0 ? edicao.funcoesMonitoria : FUNCOES_MONITORIA_PADRAO
  );
  const [edital, setEdital] = useState(edicao.editalMonitoria || "");
  const [destaque, setDestaque] = useState(edicao.destaqueMonitoria || "");
  const [corFundoDestaque, setCorFundoDestaque] = useState(
    edicao.corFundoDestaqueMonitoria || COR_FUNDO_DESTAQUE_PADRAO
  );
  const [corTextoDestaque, setCorTextoDestaque] = useState(
    edicao.corTextoDestaqueMonitoria || COR_TEXTO_DESTAQUE_PADRAO
  );
  // Texto ainda não salvo vem pré-preenchido com o genérico (sem datas).
  const [ciente, setCiente] = useState(() =>
    Object.fromEntries(
      Object.keys(TEXTOS_CIENTE_MONITORIA_PADRAO).map((campo) => [
        campo,
        edicao[campo] || TEXTOS_CIENTE_MONITORIA_PADRAO[campo],
      ])
    )
  );
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);

  const hexFundoDestaque = resolverCorHex(corFundoDestaque, OPCOES_COR_PUBLICA);
  const hexTextoDestaque = resolverCorHex(corTextoDestaque, OPCOES_COR_PUBLICA);
  const contrasteDestaque =
    hexFundoDestaque && hexTextoDestaque ? contraste(hexFundoDestaque, hexTextoDestaque) : null;

  function alterarFuncao(indice, valor) {
    setFuncoes((atual) => atual.map((funcao, i) => (i === indice ? valor : funcao)));
  }

  function moverFuncao(indice, deslocamento) {
    setFuncoes((atual) => {
      const lista = [...atual];
      const destino = indice + deslocamento;
      if (destino < 0 || destino >= lista.length) return atual;
      [lista[indice], lista[destino]] = [lista[destino], lista[indice]];
      return lista;
    });
  }

  async function salvar(evento) {
    evento.preventDefault();
    const dados = {
      inicioInscricoesMonitoria: inicio || null,
      fimInscricoesMonitoria: fim || null,
      vagasMonitoria: vagas,
      funcoesMonitoria: funcoes.map((funcao) => funcao.trim()),
      // Tabela sem texto ainda conta como conteúdo.
      editalMonitoria: edital.replace(/<[^>]*>/g, "").trim() || edital.includes("<table") ? edital : null,
      destaqueMonitoria: destaque.trim() || null,
      corFundoDestaqueMonitoria: corFundoDestaque,
      corTextoDestaqueMonitoria: corTextoDestaque,
      ...ciente,
    };
    const resultado = configuracaoMonitoriaSchema.safeParse(dados);
    if (!resultado.success) {
      setErros(extrairErros(resultado));
      notificar("Revise os campos destacados.", "erro");
      return;
    }
    setErros({});

    setSalvando(true);
    try {
      const resposta = await salvarConfiguracaoMonitoria(edicaoId, resultado.data);
      notificar(resposta.mensagem);
      await aoSalvar();
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form className={styles.formulario} onSubmit={salvar} noValidate>
      <div className={styles.secao}>
        <CabecalhoSecao
          Icone={CalendarCheck}
          titulo="Período e vagas"
          descricao="As inscrições para a monitoria só ficam abertas entre as duas datas — sem elas, ficam fechadas. As vagas são só informativas (aparecem no contador de selecionados)."
        />
        <div className={styles.camposSecao}>
          <div className={styles.linha}>
            <CampoTexto
              id="inicioInscricoesMonitoria"
              rotulo="Início das inscrições"
              type="date"
              value={paraData(inicio)}
              onChange={(e) => setInicio(combinar(inicio, { data: e.target.value }))}
              erro={erros.inicioInscricoesMonitoria}
            />
            <CampoTexto
              id="horaInicioInscricoesMonitoria"
              rotulo="Hora"
              type="time"
              value={paraHora(inicio)}
              onChange={(e) => setInicio(combinar(inicio, { hora: e.target.value }))}
            />
          </div>
          <div className={styles.linha}>
            <CampoTexto
              id="fimInscricoesMonitoria"
              rotulo="Fim das inscrições"
              type="date"
              value={paraData(fim)}
              onChange={(e) => setFim(combinar(fim, { data: e.target.value, hora: paraHora(fim) || "23:59" }))}
              erro={erros.fimInscricoesMonitoria}
            />
            <CampoTexto
              id="horaFimInscricoesMonitoria"
              rotulo="Hora"
              type="time"
              value={paraHora(fim)}
              onChange={(e) => setFim(combinar(fim, { hora: e.target.value }))}
            />
          </div>
          <CampoTexto
            id="vagasMonitoria"
            rotulo="Vagas"
            type="number"
            min={1}
            value={vagas}
            onChange={(e) => setVagas(e.target.value)}
            erro={erros.vagasMonitoria}
          />
        </div>
      </div>

      <div className={styles.secao}>
        <CabecalhoSecao
          Icone={ListChecks}
          titulo="Atividades da monitoria"
          descricao="Opções que o candidato marca em “Em quais destas atividades você se sentiria mais confortável para contribuir?”. Mudar o nome de uma atividade não altera as inscrições já feitas."
        />
        <div className={styles.camposSecao}>
          <ol className={estilos.listaFuncoes}>
            {funcoes.map((funcao, indice) => (
              <li key={indice} className={estilos.linhaFuncao}>
                <div className={estilos.campoFuncao}>
                  <CampoTexto
                    id={`funcaoMonitoria-${indice}`}
                    rotulo={`Atividade ${indice + 1}`}
                    value={funcao}
                    maxLength={200}
                    onChange={(e) => alterarFuncao(indice, e.target.value)}
                    erro={erros[`funcoesMonitoria.${indice}`]}
                  />
                </div>
                <div className={estilosTabela.acoesLinha}>
                  <button
                    type="button"
                    className={estilosTabela.botaoIcone}
                    aria-label={`Subir a atividade ${indice + 1}`}
                    disabled={indice === 0}
                    onClick={() => moverFuncao(indice, -1)}
                  >
                    <ArrowUp size={16} strokeWidth={1.5} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className={estilosTabela.botaoIcone}
                    aria-label={`Descer a atividade ${indice + 1}`}
                    disabled={indice === funcoes.length - 1}
                    onClick={() => moverFuncao(indice, 1)}
                  >
                    <ArrowDown size={16} strokeWidth={1.5} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className={`${estilosTabela.botaoIcone} ${estilosTabela.botaoIconePerigo}`}
                    aria-label={`Remover a atividade ${indice + 1}`}
                    onClick={() => setFuncoes((atual) => atual.filter((_, i) => i !== indice))}
                  >
                    <Trash2 size={16} strokeWidth={1.5} aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ol>
          {erros.funcoesMonitoria && <p className={estilos.textoErro}>{erros.funcoesMonitoria}</p>}
          <div>
            <Botao
              type="button"
              variante="secundario"
              onClick={() => setFuncoes((atual) => [...atual, ""])}
              disabled={funcoes.length >= 30}
            >
              <Plus size={18} strokeWidth={1.5} aria-hidden="true" />
              Adicionar atividade
            </Botao>
          </div>
        </div>
      </div>

      <div className={styles.secao}>
        <CabecalhoSecao
          Icone={CheckSquare}
          titulo="Estou ciente de que"
          descricao="Confirmações obrigatórias que o candidato marca no fim do formulário. Atualize as datas a cada edição."
        />
        <div className={styles.camposSecao}>
          <CampoTexto
            id="cienteFormacaoMonitoria"
            rotulo="a) Formação de monitores"
            maxLength={500}
            value={ciente.cienteFormacaoMonitoria}
            onChange={(e) => setCiente((atual) => ({ ...atual, cienteFormacaoMonitoria: e.target.value }))}
            erro={erros.cienteFormacaoMonitoria}
          />
          <CampoTexto
            id="cienteDisponibilidadeMonitoria"
            rotulo="b) Disponibilidade nos dias do evento"
            maxLength={500}
            value={ciente.cienteDisponibilidadeMonitoria}
            onChange={(e) => setCiente((atual) => ({ ...atual, cienteDisponibilidadeMonitoria: e.target.value }))}
            erro={erros.cienteDisponibilidadeMonitoria}
          />
          <CampoTexto
            id="cienteVoluntariaMonitoria"
            rotulo="c) Trabalho voluntário"
            maxLength={500}
            value={ciente.cienteVoluntariaMonitoria}
            onChange={(e) => setCiente((atual) => ({ ...atual, cienteVoluntariaMonitoria: e.target.value }))}
            erro={erros.cienteVoluntariaMonitoria}
          />
        </div>
      </div>

      <div className={styles.secao}>
        <CabecalhoSecao
          Icone={FileText}
          titulo="Edital"
          descricao="Texto da chamada mostrado na página pública /monitoria, com títulos, listas e tabelas. O link “Monitoria” aparece no menu do site assim que houver texto. O selo de destaque aparece logo abaixo do título da página; deixe em branco para não mostrar. Texto colado entra sem formatação: aplique títulos, listas e tabelas pelos botões."
        />
        <div className={styles.camposSecao}>
          <CampoTexto
            id="destaqueMonitoria"
            rotulo="Selo de destaque (opcional)"
            placeholder="Ex.: Com certificado de 60h"
            maxLength={80}
            value={destaque}
            onChange={(e) => setDestaque(e.target.value)}
            erro={erros.destaqueMonitoria}
          />
          {destaque.trim() && (
            <>
              <CampoCorSecao
                id="corFundoDestaqueMonitoria"
                rotulo="Cor de fundo do selo"
                valor={corFundoDestaque}
                opcoes={OPCOES_COR_PUBLICA}
                onChange={setCorFundoDestaque}
              />
              <CampoCorSecao
                id="corTextoDestaqueMonitoria"
                rotulo="Cor do texto do selo"
                valor={corTextoDestaque}
                opcoes={OPCOES_COR_PUBLICA}
                onChange={setCorTextoDestaque}
              />
              <div className={estilos.previaDestaque}>
                <span className={estilos.rotuloPrevia}>Prévia</span>
                <span
                  className={estilos.seloDestaque}
                  style={{ background: hexFundoDestaque, color: hexTextoDestaque }}
                >
                  {destaque.trim()}
                </span>
              </div>
              {contrasteDestaque !== null && contrasteDestaque < LIMIAR_CONTRASTE_TEXTO && (
                <p className={styles.avisoContraste}>
                  Contraste baixo entre fundo e texto do selo ({contrasteDestaque.toFixed(1)}:1 — mínimo recomendado{" "}
                  {LIMIAR_CONTRASTE_TEXTO}:1). Pode ficar difícil de ler.
                </p>
              )}
            </>
          )}
          <CampoRichText
            id="editalMonitoria"
            rotulo="Texto do edital"
            value={edital}
            onChange={setEdital}
            erro={erros.editalMonitoria}
            ferramentas={["titulos", "negrito", "italico", "lista", "listaNumerada", "link"]}
            permitirTabela
            alto
          />
        </div>
      </div>

      <div className={estilos.rodapeFormulario}>
        <Botao type="submit" carregando={salvando}>
          Salvar configurações
        </Botao>
      </div>
    </form>
  );
}
