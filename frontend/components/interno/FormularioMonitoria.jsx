"use client";

import { useState } from "react";
import Link from "next/link";
import Botao from "@/components/forms/Botao";
import CampoTexto from "./CampoTexto";
import CampoSugestoes from "./CampoSugestoes";
import CampoCheckbox from "./CampoCheckbox";
import CampoRadioSecao from "./CampoRadioSecao";
import CampoArquivo from "./CampoArquivo";
import CamposAdaptacao from "./CamposAdaptacao";
import { useToast } from "./ToastProvider";
import { formatarIdentificacao } from "@/lib/identificacao";
import { criarInscricaoMonitoriaSchema, extrairErros } from "@/lib/validacao";
import { dataReferenciaIdade, ehMenor, textoCienteMonitoria } from "@/lib/monitoria";
import styles from "./FormularioMonitoria.module.scss";

const SUGESTOES_PRONOME = [
  "Ela/dela",
  "Ele/dele",
  "Elu/delu",
  "Qualquer pronome",
];

const SIM_NAO = [
  { valor: "SIM", rotulo: "Sim" },
  { valor: "NAO", rotulo: "Não" },
];

function estadoInicial(inscricao) {
  return {
    dataNascimento: inscricao?.dataNascimento
      ? String(inscricao.dataNascimento).slice(0, 10)
      : "",
    pronome: inscricao?.pronome || "",
    telefone: inscricao?.telefone || "",
    cursoInstituicao: inscricao?.cursoInstituicao || "",
    experienciaAnterior: inscricao ? inscricao.experienciaAnterior : null,
    funcoes: inscricao?.funcoes || [],
    adaptacao: {
      precisaAdaptacao: inscricao ? inscricao.precisaAdaptacao : null,
      adaptacoesNecessarias: inscricao?.adaptacoesNecessarias || "",
    },
    // Quem está editando já confirmou ao se inscrever.
    cienteFormacao: Boolean(inscricao),
    cienteDisponibilidade: Boolean(inscricao),
    cienteVoluntaria: Boolean(inscricao),
    autorizacao: null,
  };
}

// Questionário de inscrição na monitoria (validado por
// criarInscricaoMonitoriaSchema, espelho do backend). Nome, CPF e e-mail vêm
// da conta. A autorização do responsável fica sempre no fim do formulário, mas
// só é exigida (e enviada) para quem terá menos de 18 anos no primeiro dia do
// evento — o backend descarta o anexo de quem é maior de idade.
export default function FormularioMonitoria({
  edicao,
  usuario,
  inscricao,
  aoEnviar,
  aoCancelar,
}) {
  const { notificar } = useToast();
  const [form, setForm] = useState(() => estadoInicial(inscricao));
  const [erros, setErros] = useState({});
  const [enviando, setEnviando] = useState(false);

  const funcoesDisponiveis = [
    ...new Set([
      ...edicao.funcoesMonitoria,
      ...form.funcoes.filter(
        (funcao) => !edicao.funcoesMonitoria.includes(funcao),
      ),
    ]),
  ];
  const menor = ehMenor(form.dataNascimento, edicao);

  function alterar(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  function alternarFuncao(funcao, marcada) {
    setForm((atual) => ({
      ...atual,
      funcoes: marcada
        ? [...atual.funcoes, funcao]
        : atual.funcoes.filter((item) => item !== funcao),
    }));
  }

  async function enviar(evento) {
    evento.preventDefault();
    const dados = {
      dataNascimento: form.dataNascimento,
      pronome: form.pronome,
      telefone: form.telefone,
      cursoInstituicao: form.cursoInstituicao,
      experienciaAnterior: form.experienciaAnterior,
      // Função que saiu do catálogo depois da inscrição não pode ser reenviada.
      funcoes: form.funcoes.filter((funcao) =>
        edicao.funcoesMonitoria.includes(funcao),
      ),
      precisaAdaptacao: form.adaptacao.precisaAdaptacao,
      adaptacoesNecessarias: form.adaptacao.precisaAdaptacao
        ? form.adaptacao.adaptacoesNecessarias
        : null,
      cienteFormacao: form.cienteFormacao,
      cienteDisponibilidade: form.cienteDisponibilidade,
      cienteVoluntaria: form.cienteVoluntaria,
      autorizacaoResponsavel: menor
        ? (form.autorizacao?.dataUri ?? null)
        : null,
    };

    const resultado = criarInscricaoMonitoriaSchema({
      funcoesPermitidas: edicao.funcoesMonitoria,
      dataReferencia: dataReferenciaIdade(edicao),
      temAutorizacaoSalva: Boolean(inscricao?.temAutorizacao),
    }).safeParse(dados);
    if (!resultado.success) {
      setErros(extrairErros(resultado));
      notificar("Revise os campos destacados.", "erro");
      return;
    }
    setErros({});

    setEnviando(true);
    try {
      await aoEnviar(dados);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className={styles.formulario} onSubmit={enviar} noValidate>
      <section className={styles.bloco} aria-labelledby="monitoria-dados">
        <h2 id="monitoria-dados" className={styles.tituloBloco}>
          Dados pessoais
        </h2>
        <dl className={styles.dadosConta}>
          <div>
            <dt>Nome</dt>
            <dd>{usuario?.nome}</dd>
          </div>
          <div>
            <dt>CPF / Documento</dt>
            <dd>{formatarIdentificacao(usuario) || "—"}</dd>
          </div>
          <div>
            <dt>E-mail</dt>
            <dd>{usuario?.email}</dd>
          </div>
        </dl>
        <p className={styles.apoio}>
          Esses dados vêm da sua conta. Para corrigir o nome (ou usar o nome
          social), acesse{" "}
          <Link href="/participante/perfil" className={styles.link}>
            Meu perfil
          </Link>
          .
        </p>
        <div className={styles.linha}>
          <CampoTexto
            id="dataNascimento"
            rotulo="Data de nascimento"
            type="date"
            value={form.dataNascimento}
            onChange={(e) => alterar("dataNascimento", e.target.value)}
            erro={erros.dataNascimento}
          />
          <CampoTexto
            id="telefone"
            rotulo="Telefone para contato, com DDD"
            type="tel"
            autoComplete="tel"
            placeholder="(61) 99999-9999"
            value={form.telefone}
            onChange={(e) => alterar("telefone", e.target.value)}
            erro={erros.telefone}
          />
        </div>
        <CampoSugestoes
          id="pronome"
          rotulo="Identidade de gênero — qual pronome de tratamento você prefere? (opcional)"
          sugestoes={SUGESTOES_PRONOME}
          placeholder="Escolha uma sugestão ou escreva"
          maxLength={100}
          value={form.pronome}
          onChange={(valor) => alterar("pronome", valor)}
          erro={erros.pronome}
        />
        <CampoTexto
          id="cursoInstituicao"
          rotulo="Curso e instituição"
          placeholder="Ex.: Licenciatura em Geografia - UnB"
          maxLength={300}
          value={form.cursoInstituicao}
          onChange={(e) => alterar("cursoInstituicao", e.target.value)}
          erro={erros.cursoInstituicao}
        />
      </section>

      <section
        className={styles.bloco}
        aria-labelledby="monitoria-participacao"
      >
        <h2 id="monitoria-participacao" className={styles.tituloBloco}>
          Participação na monitoria
        </h2>
        <CampoRadioSecao
          id="experienciaAnterior"
          rotulo="Você tem experiência anterior como monitora/monitor em evento acadêmico?"
          valor={
            form.experienciaAnterior === true
              ? "SIM"
              : form.experienciaAnterior === false
                ? "NAO"
                : null
          }
          onChange={(opcao) => alterar("experienciaAnterior", opcao === "SIM")}
          opcoes={SIM_NAO}
          erro={erros.experienciaAnterior}
        />
        <fieldset
          className={styles.grupo}
          aria-invalid={erros.funcoes ? "true" : undefined}
          aria-describedby={erros.funcoes ? "funcoes-erro" : undefined}
        >
          <legend className={styles.legenda}>
            Em quais destas atividades você se sentiria mais confortável para
            contribuir? Você pode selecionar mais de uma opção.
          </legend>
          {funcoesDisponiveis.map((funcao, indice) => (
            <CampoCheckbox
              key={funcao}
              id={`funcao-${indice}`}
              rotulo={funcao}
              checked={form.funcoes.includes(funcao)}
              onChange={(marcada) => alternarFuncao(funcao, marcada)}
              disabled={!edicao.funcoesMonitoria.includes(funcao)}
            />
          ))}
          {erros.funcoes && (
            <p id="funcoes-erro" className={styles.erro}>
              {erros.funcoes}
            </p>
          )}
        </fieldset>
        <CamposAdaptacao
          id="monitoria-adaptacao"
          pergunta="Você precisa de algum recurso de acessibilidade ou adaptação para atuar como monitora ou monitor durante o evento?"
          valor={form.adaptacao}
          onChange={(valor) => alterar("adaptacao", valor)}
          erros={erros}
        />
      </section>

      <section className={styles.bloco} aria-labelledby="monitoria-ciencia">
        <h2 id="monitoria-ciencia" className={styles.tituloBloco}>
          Estou ciente de que
        </h2>
        <div className={styles.grupo}>
          <CampoCheckbox
            id="cienteFormacao"
            rotulo={textoCienteMonitoria(edicao, "cienteFormacaoMonitoria")}
            checked={form.cienteFormacao}
            onChange={(valor) => alterar("cienteFormacao", valor)}
          />
          {erros.cienteFormacao && (
            <p className={styles.erro}>{erros.cienteFormacao}</p>
          )}
          <CampoCheckbox
            id="cienteDisponibilidade"
            rotulo={textoCienteMonitoria(edicao, "cienteDisponibilidadeMonitoria")}
            checked={form.cienteDisponibilidade}
            onChange={(valor) => alterar("cienteDisponibilidade", valor)}
          />
          {erros.cienteDisponibilidade && (
            <p className={styles.erro}>{erros.cienteDisponibilidade}</p>
          )}
          <CampoCheckbox
            id="cienteVoluntaria"
            rotulo={textoCienteMonitoria(edicao, "cienteVoluntariaMonitoria")}
            checked={form.cienteVoluntaria}
            onChange={(valor) => alterar("cienteVoluntaria", valor)}
          />
          {erros.cienteVoluntaria && (
            <p className={styles.erro}>{erros.cienteVoluntaria}</p>
          )}
        </div>
      </section>

      <section
        className={styles.bloco}
        aria-labelledby="monitoria-autorizacao"
      >
        <h2 id="monitoria-autorizacao" className={styles.tituloBloco}>
          Autorização do(a) responsável
        </h2>
        <CampoArquivo
          id="autorizacaoResponsavel"
          rotulo="Caso você seja menor de 18 anos, favor anexar autorização do responsável para participar da atividade."
          descricao={
            menor
              ? "Obrigatório: pela data de nascimento, você terá menos de 18 anos no primeiro dia do evento. Anexe a autorização assinada pelo(a) responsável (PDF, JPG ou PNG, até 5MB)."
              : "Obrigatório só para quem terá menos de 18 anos no primeiro dia do evento — maiores de idade não precisam anexar. PDF, JPG ou PNG, até 5MB."
          }
          valor={form.autorizacao}
          onChange={(valor) => alterar("autorizacao", valor)}
          arquivoSalvo={Boolean(inscricao?.temAutorizacao)}
          erro={erros.autorizacaoResponsavel}
        />
      </section>

      <div className={styles.acoes}>
        {aoCancelar && (
          <Botao type="button" variante="secundario" onClick={aoCancelar}>
            Cancelar
          </Botao>
        )}
        <Botao type="submit" carregando={enviando}>
          {inscricao && inscricao.status !== "CANCELADA"
            ? "Salvar alterações"
            : "Enviar inscrição"}
        </Botao>
      </div>
    </form>
  );
}
