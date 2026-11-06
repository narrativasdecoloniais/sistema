"use client";

import { useState } from "react";
import Botao from "@/components/forms/Botao";
import Alerta from "@/components/forms/Alerta";
import BuscaUsuario from "./BuscaUsuario";
import CampoSelecao from "./CampoSelecao";
import CampoTexto from "./CampoTexto";
import CampoArea from "./CampoArea";
import CampoCheckbox from "./CampoCheckbox";
import { useToast } from "./ToastProvider";
import { dataReferenciaIdade, incluirMonitor } from "@/lib/monitoria";
import { criarInclusaoMonitorSchema, extrairErros } from "@/lib/validacao";
import styles from "./IncluirMonitorForm.module.scss";

// Inclusão de monitor(a) pela Coordenação de Monitoria, para quem não se
// candidatou pelo formulário (conta já existente). Só a conta e a situação
// são obrigatórias; a pessoa completa o resto na área do participante.
export default function IncluirMonitorForm({ edicaoId, edicao, aoSalvar, aoCancelar }) {
  const { notificar } = useToast();
  const divulgado = Boolean(edicao.resultadoMonitoriaDivulgadoEm);

  const [usuario, setUsuario] = useState(null);
  const [status, setStatus] = useState("SELECIONADO");
  const [telefone, setTelefone] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [cursoInstituicao, setCursoInstituicao] = useState("");
  const [funcoes, setFuncoes] = useState([]);
  const [observacao, setObservacao] = useState("");
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [salvando, setSalvando] = useState(false);

  function alternarFuncao(funcao, marcada) {
    setFuncoes((atual) => (marcada ? [...atual, funcao] : atual.filter((item) => item !== funcao)));
  }

  async function aoSubmeter(evento) {
    evento.preventDefault();
    setErroGeral("");

    const resultado = criarInclusaoMonitorSchema({
      funcoesPermitidas: edicao.funcoesMonitoria,
      dataReferencia: dataReferenciaIdade(edicao),
    }).safeParse({
      usuarioId: usuario?.id || "",
      status,
      telefone,
      dataNascimento,
      cursoInstituicao,
      funcoes,
      observacaoCoordenacao: observacao,
    });
    if (!resultado.success) {
      setErros(extrairErros(resultado));
      return;
    }
    setErros({});
    setSalvando(true);

    try {
      const resposta = await incluirMonitor(edicaoId, resultado.data);
      notificar(
        divulgado
          ? `${usuario.nome} foi incluído(a). O aviso por e-mail fica pendente até "Enviar e-mails pendentes".`
          : `${usuario.nome} foi incluído(a) na monitoria.`
      );
      aoSalvar(resposta.inscricao);
    } catch (erro) {
      setErroGeral(erro.message);
      notificar(erro.message, "erro");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={aoSubmeter} className={styles.formulario} noValidate>
      <Alerta>{erroGeral}</Alerta>
      <p className={styles.apoio}>
        Para quem não se inscreveu pelo formulário. A pessoa precisa ter conta no site. Os demais dados são
        opcionais: ela completa o cadastro na área do participante, mesmo com as inscrições encerradas.
      </p>

      <BuscaUsuario
        id="incluir-monitor-usuario"
        rotulo="Pessoa"
        usuarioSelecionado={usuario}
        onSelecionar={setUsuario}
        erro={erros.usuarioId}
      />

      <CampoSelecao
        id="incluir-monitor-status"
        rotulo="Situação"
        value={status}
        onChange={(evento) => setStatus(evento.target.value)}
        erro={erros.status}
      >
        <option value="SELECIONADO">Selecionado(a)</option>
        <option value="LISTA_ESPERA">Lista de espera (entra na última posição)</option>
        {!divulgado && <option value="EM_ANALISE">Em análise</option>}
      </CampoSelecao>

      <div className={styles.linha}>
        <CampoTexto
          id="incluir-monitor-telefone"
          rotulo="Telefone (opcional)"
          type="tel"
          inputMode="tel"
          value={telefone}
          onChange={(evento) => setTelefone(evento.target.value)}
          placeholder="(61) 99999-9999"
          erro={erros.telefone}
        />
        <CampoTexto
          id="incluir-monitor-nascimento"
          rotulo="Data de nascimento (opcional)"
          type="date"
          value={dataNascimento}
          onChange={(evento) => setDataNascimento(evento.target.value)}
          erro={erros.dataNascimento}
        />
      </div>

      <CampoTexto
        id="incluir-monitor-curso"
        rotulo="Curso e instituição (opcional)"
        value={cursoInstituicao}
        onChange={(evento) => setCursoInstituicao(evento.target.value)}
        erro={erros.cursoInstituicao}
      />

      {edicao.funcoesMonitoria.length > 0 && (
        <fieldset className={styles.grupo}>
          <legend className={styles.legenda}>Atividades (opcional)</legend>
          {edicao.funcoesMonitoria.map((funcao, indice) => (
            <CampoCheckbox
              key={funcao}
              id={`incluir-monitor-funcao-${indice}`}
              rotulo={funcao}
              checked={funcoes.includes(funcao)}
              onChange={(marcada) => alternarFuncao(funcao, marcada)}
            />
          ))}
          {erros.funcoes && <p className={styles.erro}>{erros.funcoes}</p>}
        </fieldset>
      )}

      <CampoArea
        id="incluir-monitor-observacao"
        rotulo="Observação interna (opcional)"
        linhas={3}
        value={observacao}
        onChange={(evento) => setObservacao(evento.target.value)}
        erro={erros.observacaoCoordenacao}
      />

      <div className={styles.acoes}>
        <Botao type="button" variante="secundario" onClick={aoCancelar}>
          Cancelar
        </Botao>
        <Botao type="submit" carregando={salvando}>
          Incluir
        </Botao>
      </div>
    </form>
  );
}
