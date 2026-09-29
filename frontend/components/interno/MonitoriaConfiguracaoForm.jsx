"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, CalendarCheck, FileText, ListChecks, Plus, Trash2 } from "lucide-react";
import Botao from "@/components/forms/Botao";
import CampoRichText from "@/components/forms/CampoRichText";
import CabecalhoSecao from "./CabecalhoSecao";
import CampoTexto from "./CampoTexto";
import { useToast } from "./ToastProvider";
import { paraData, paraHora, combinar } from "@/lib/dataHoraIngenua";
import { configuracaoMonitoriaSchema, extrairErros } from "@/lib/validacao";
import { FUNCOES_MONITORIA_PADRAO, salvarConfiguracaoMonitoria } from "@/lib/monitoria";
import styles from "./EdicaoForm.module.scss";
import estilosTabela from "./AvaliacaoSubmissoesPainel.module.scss";
import estilos from "./MonitoriaPainel.module.scss";

// Configurações da chamada de monitoria da edição: período de inscrição
// (mesma convenção de data/hora "ingênua" das inscrições do evento), vagas
// (só informativo), funções que o candidato escolhe e o texto do edital
// mostrado na página pública /monitoria. Salva tudo num PATCH só.
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
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);

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
          Icone={FileText}
          titulo="Edital"
          descricao="Texto da chamada mostrado na página pública /monitoria, com títulos, listas e tabelas. O link “Monitoria” aparece no menu do site assim que houver texto. Texto colado entra sem formatação: aplique títulos, listas e tabelas pelos botões."
        />
        <div className={styles.camposSecao}>
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
