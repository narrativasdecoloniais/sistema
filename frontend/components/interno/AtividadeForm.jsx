"use client";

import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "primereact/button";
import CampoTexto from "./CampoTexto";
import CampoNumero from "./CampoNumero";
import CampoArea from "./CampoArea";
import CampoSelecao from "./CampoSelecao";
import CampoCheckbox from "./CampoCheckbox";
import Campo from "@/components/forms/Campo";
import Alerta from "@/components/forms/Alerta";
import ModalConfirmacao from "./ModalConfirmacao";
import PessoaEnvolvidaLinha from "./PessoaEnvolvidaLinha";
import { apiClient } from "@/lib/apiClient";
import { atividadeSchema, extrairErros } from "@/lib/validacao";
import { gerarSlug } from "@/lib/slug";
import { paraData, paraHora, combinar } from "@/lib/dataHoraIngenua";
import { useToast } from "./ToastProvider";
import styles from "./AtividadeForm.module.scss";

// Soma horas a um horário "HH:MM", dando a volta na meia-noite se preciso.
function somarHora(hora, horas) {
  if (!hora) return "";
  const [h, m] = hora.split(":").map(Number);
  const totalMinutos = (((h * 60 + m + horas * 60) % (24 * 60)) + 24 * 60) % (24 * 60);
  return `${String(Math.floor(totalMinutos / 60)).padStart(2, "0")}:${String(totalMinutos % 60).padStart(2, "0")}`;
}

function estadoInicial(atividadeInicial) {
  return {
    tipoAtividadeId: atividadeInicial?.tipoAtividadeId || "",
    nome: atividadeInicial?.nome || "",
    slug: atividadeInicial?.slug || "",
    descricao: atividadeInicial?.descricao || "",
    cargaHoraria: atividadeInicial?.cargaHoraria ?? null,
    local: atividadeInicial?.local || "",
    exigeInscricao: atividadeInicial?.exigeInscricao ?? true,
    semLimiteVagas: atividadeInicial?.semLimiteVagas || false,
    vagas: atividadeInicial?.vagas ?? null,
    inicioAtividade: atividadeInicial?.inicioAtividade || "",
    fimAtividade: atividadeInicial?.fimAtividade || "",
    // localId é só de identidade na UI (chave React, linha expandida) —
    // pessoa nova ganha um UUID cliente-only; pessoa existente reusa o id
    // do banco, que já é estável. Nunca é lido pelo backend: o zod (modo
    // strip por padrão) descarta a chave antes do envio.
    pessoas: (atividadeInicial?.pessoas || []).map((pessoa) => ({
      id: pessoa.id,
      localId: pessoa.id,
      nome: pessoa.nome || "",
      imagem: pessoa.imagem || null,
      descricao: pessoa.descricao || "",
      breveDescricao: pessoa.breveDescricao || "",
      tipoParticipacaoId: pessoa.tipoParticipacao?.id || "",
    })),
  };
}

// AtividadePessoa.imagem agora é uma URL do storage, não a imagem em si — só
// reenviamos o campo quando a foto realmente mudou (novo data URI) ou foi
// removida (null); caso contrário a URL atual reprovaria a validação (que só
// aceita data:image/…) e sobrescreveria sem necessidade.
function paraPayload(dados, atividadeInicial) {
  const imagensOriginais = new Map((atividadeInicial?.pessoas || []).map((pessoa) => [pessoa.id, pessoa.imagem]));

  return {
    ...dados,
    descricao: dados.descricao || undefined,
    cargaHoraria: dados.cargaHoraria ?? undefined,
    local: dados.local || undefined,
    pessoas: (dados.pessoas || []).map((pessoa) => {
      const imagemOriginal = pessoa.id ? imagensOriginais.get(pessoa.id) ?? null : null;
      const imagemAlterada = pessoa.imagem !== imagemOriginal;
      return {
        ...pessoa,
        imagem: imagemAlterada ? pessoa.imagem : undefined,
        descricao: pessoa.descricao || undefined,
        breveDescricao: pessoa.breveDescricao || undefined,
        tipoParticipacaoId: pessoa.tipoParticipacaoId || undefined,
      };
    }),
  };
}

// Espelha o algoritmo de agruparPessoasPorTipoParticipacao
// (frontend/lib/publico.js): agrupa na ordem de primeiro aparecimento no
// array, não na ordem do catálogo de tipos, pra essa listagem ser um
// preview fiel da ordem que sai na página pública.
function agruparPessoasPorTipo(pessoas, tiposParticipacao) {
  const nomesPorId = new Map(tiposParticipacao.map((tipo) => [tipo.id, tipo.nome]));
  const grupos = new Map();

  pessoas.forEach((pessoa, indiceFlat) => {
    const chave = pessoa.tipoParticipacaoId || "sem-tipo";
    const rotulo = pessoa.tipoParticipacaoId
      ? nomesPorId.get(pessoa.tipoParticipacaoId) || "Tipo removido"
      : "Outros participantes";
    if (!grupos.has(chave)) grupos.set(chave, { chave, rotulo, itens: [] });
    grupos.get(chave).itens.push({ pessoa, indiceFlat });
  });

  return Array.from(grupos.values());
}

export default function AtividadeForm({
  edicaoId,
  atividadeInicial,
  tiposAtividade,
  tiposParticipacao,
  aoSalvar,
  aoCancelar,
  aoExcluir,
}) {
  const { notificar } = useToast();
  const modoEdicao = Boolean(atividadeInicial);

  const [dados, setDados] = useState(() => estadoInicial(atividadeInicial));
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [pessoaExpandidaId, setPessoaExpandidaId] = useState(null);

  const gruposPessoas = useMemo(
    () => agruparPessoasPorTipo(dados.pessoas, tiposParticipacao),
    [dados.pessoas, tiposParticipacao]
  );

  async function aoConfirmarExclusao() {
    setExcluindo(true);
    try {
      await aoExcluir(atividadeInicial.id);
    } finally {
      setExcluindo(false);
      setConfirmandoExclusao(false);
    }
  }

  function atualizarCampo(campo, valor) {
    setDados((atual) => ({ ...atual, [campo]: valor }));
  }

  function aoMudarNome(valor) {
    setDados((atual) => ({
      ...atual,
      nome: valor,
      // Só gera o slug a partir do nome na criação — numa atividade já
      // existente, o link público não deve mudar quando o nome é editado.
      slug: modoEdicao ? atual.slug : gerarSlug(valor),
    }));
  }

  function aoMudarAgenda(campo, valor) {
    setDados((atual) => {
      const novo = { ...atual, [campo]: valor };

      if (campo === "inicioAtividade" && valor) {
        // repete a data e soma 1h na hora do fim, só pra facilitar o
        // preenchimento — o usuário pode ajustar o fim depois se quiser.
        novo.fimAtividade = combinar(novo.fimAtividade, {
          data: paraData(valor),
          hora: somarHora(paraHora(valor), 1),
        });
      }

      if (campo === "semLimiteVagas") {
        novo.vagas = valor ? null : novo.vagas;
      }

      if (campo === "exigeInscricao" && !valor) {
        novo.semLimiteVagas = false;
        novo.vagas = null;
      }

      return novo;
    });
  }

  function aoMudarPessoa(indice, campo, valor) {
    setDados((atual) => {
      const pessoas = [...atual.pessoas];
      pessoas[indice] = { ...pessoas[indice], [campo]: valor };
      return { ...atual, pessoas };
    });
  }

  function aoAdicionarPessoa() {
    const localId = crypto.randomUUID();
    setDados((atual) => ({
      ...atual,
      pessoas: [
        ...atual.pessoas,
        { localId, nome: "", imagem: null, descricao: "", breveDescricao: "", tipoParticipacaoId: "" },
      ],
    }));
    // pessoa nova ainda não tem nome — deixa aberta pra não virar uma linha
    // em branco fechada, com aparência quebrada.
    setPessoaExpandidaId(localId);
  }

  function aoRemoverPessoa(indice) {
    const localId = dados.pessoas[indice]?.localId;
    setDados((atual) => ({
      ...atual,
      pessoas: atual.pessoas.filter((_, i) => i !== indice),
    }));
    setPessoaExpandidaId((atual) => (atual === localId ? null : atual));
  }

  function aoAlternarExpandirPessoa(localId) {
    setPessoaExpandidaId((atual) => (atual === localId ? null : localId));
  }

  // Troca de posição, no array flat, a pessoa movida com a vizinha
  // adjacente dentro do MESMO tipo (preservando a ordem relativa atual do
  // grupo) — nunca mexe em pessoas de outro tipo, então a ordem das seções
  // (definida por qual tipo aparece primeiro no array) nunca é afetada por
  // essa troca.
  function moverPessoa(localId, direcao) {
    setDados((atual) => {
      const { pessoas } = atual;
      const indiceAtual = pessoas.findIndex((pessoa) => pessoa.localId === localId);
      if (indiceAtual === -1) return atual;

      const chave = pessoas[indiceAtual].tipoParticipacaoId || "sem-tipo";
      const indicesGrupo = [];
      pessoas.forEach((pessoa, indice) => {
        if ((pessoa.tipoParticipacaoId || "sem-tipo") === chave) indicesGrupo.push(indice);
      });

      const posicaoGrupo = indicesGrupo.indexOf(indiceAtual);
      const posicaoAlvo = posicaoGrupo + direcao;
      if (posicaoAlvo < 0 || posicaoAlvo >= indicesGrupo.length) return atual;

      const indiceAlvo = indicesGrupo[posicaoAlvo];
      const novasPessoas = [...pessoas];
      [novasPessoas[indiceAtual], novasPessoas[indiceAlvo]] = [novasPessoas[indiceAlvo], novasPessoas[indiceAtual]];
      return { ...atual, pessoas: novasPessoas };
    });
  }

  async function aoSubmeter(evento) {
    evento.preventDefault();
    setErroGeral("");

    const resultado = atividadeSchema.safeParse(paraPayload(dados, atividadeInicial));
    if (!resultado.success) {
      setErros(extrairErros(resultado));
      return;
    }
    setErros({});
    setSalvando(true);

    try {
      const resposta = modoEdicao
        ? await apiClient.patch(
            `/edicoes/${edicaoId}/atividades/${atividadeInicial.id}`,
            resultado.data
          )
        : await apiClient.post(`/edicoes/${edicaoId}/atividades`, resultado.data);
      notificar(
        modoEdicao ? "Atividade atualizada com sucesso." : "Atividade criada com sucesso."
      );
      aoSalvar(resposta.atividade);
    } catch (erro) {
      setErroGeral(erro.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
    <form onSubmit={aoSubmeter} className={styles.formulario}>
      <Alerta>{erroGeral}</Alerta>
      <CampoSelecao
        id="tipoAtividadeId"
        rotulo="Tipo de atividade"
        value={dados.tipoAtividadeId}
        onChange={(evento) => atualizarCampo("tipoAtividadeId", evento.target.value)}
        erro={erros.tipoAtividadeId}
      >
        <option value="">Selecione um tipo</option>
        {tiposAtividade.map((tipo) => (
          <option key={tipo.id} value={tipo.id}>
            {tipo.nome}
          </option>
        ))}
      </CampoSelecao>
      {tiposAtividade.length === 0 && (
        <p className={styles.avisoSemTipos}>
          Nenhum tipo de atividade cadastrado ainda. Crie um em Configurações → Tipos de
          atividade antes de cadastrar a atividade.
        </p>
      )}
      <CampoTexto
        id="nome"
        rotulo="Nome da atividade"
        value={dados.nome}
        onChange={(evento) => aoMudarNome(evento.target.value)}
        erro={erros.nome}
      />
      <CampoArea
        id="descricao"
        rotulo="Descrição"
        linhas={4}
        value={dados.descricao}
        onChange={(evento) => atualizarCampo("descricao", evento.target.value)}
        erro={erros.descricao}
      />
      <div className={styles.linha}>
        <CampoNumero
          id="cargaHoraria"
          rotulo="Carga horária (horas)"
          value={dados.cargaHoraria}
          onValueChange={(evento) => atualizarCampo("cargaHoraria", evento.value)}
          erro={erros.cargaHoraria}
        />
        <CampoTexto
          id="local"
          rotulo="Local"
          value={dados.local}
          onChange={(evento) => atualizarCampo("local", evento.target.value)}
          erro={erros.local}
        />
      </div>

      <div className={styles.linha}>
        <Campo
          id="data-inicio"
          rotulo="Início da atividade"
          type="date"
          value={paraData(dados.inicioAtividade)}
          onChange={(evento) =>
            aoMudarAgenda("inicioAtividade", combinar(dados.inicioAtividade, { data: evento.target.value }))
          }
          erro={erros.inicioAtividade}
        />
        <Campo
          id="hora-inicio"
          rotulo="Hora"
          type="time"
          value={paraHora(dados.inicioAtividade)}
          onChange={(evento) =>
            aoMudarAgenda("inicioAtividade", combinar(dados.inicioAtividade, { hora: evento.target.value }))
          }
        />
      </div>
      <div className={styles.linha}>
        <Campo
          id="data-fim"
          rotulo="Fim da atividade"
          type="date"
          value={paraData(dados.fimAtividade)}
          onChange={(evento) =>
            aoMudarAgenda("fimAtividade", combinar(dados.fimAtividade, { data: evento.target.value }))
          }
          erro={erros.fimAtividade}
        />
        <Campo
          id="hora-fim"
          rotulo="Hora"
          type="time"
          value={paraHora(dados.fimAtividade)}
          onChange={(evento) =>
            aoMudarAgenda("fimAtividade", combinar(dados.fimAtividade, { hora: evento.target.value }))
          }
        />
      </div>
      <CampoCheckbox
        id="exige-inscricao"
        rotulo="Exige inscrição"
        checked={dados.exigeInscricao}
        onChange={(valor) => aoMudarAgenda("exigeInscricao", valor)}
      />
      {dados.exigeInscricao && (
        <>
          <CampoCheckbox
            id="sem-limite"
            rotulo="Sem limite de participantes"
            checked={dados.semLimiteVagas}
            onChange={(valor) => aoMudarAgenda("semLimiteVagas", valor)}
          />
          {!dados.semLimiteVagas && (
            <CampoNumero
              id="vagas"
              rotulo="Quantidade máxima de participantes"
              value={dados.vagas}
              onValueChange={(evento) => aoMudarAgenda("vagas", evento.value)}
              erro={erros.vagas}
            />
          )}
        </>
      )}

      <div className={styles.secaoPessoas}>
        <span className={styles.rotuloLista}>Pessoas envolvidas</span>
        {tiposParticipacao.length === 0 && (
          <p className={styles.avisoSemTipos}>
            Nenhum tipo de participação cadastrado ainda. Crie um em Configurações → Tipos de
            participação para poder classificar as pessoas envolvidas (opcional).
          </p>
        )}
        {gruposPessoas.map((grupo) => (
          <div key={grupo.chave} className={styles.grupoPessoas}>
            <span className={styles.tituloGrupo}>{grupo.rotulo}</span>
            {grupo.itens.map(({ pessoa, indiceFlat }, posicaoGrupo) => (
              <PessoaEnvolvidaLinha
                key={pessoa.localId}
                pessoa={pessoa}
                indiceFlat={indiceFlat}
                expandida={pessoaExpandidaId === pessoa.localId}
                podeSubir={posicaoGrupo > 0}
                podeDescer={posicaoGrupo < grupo.itens.length - 1}
                tiposParticipacao={tiposParticipacao}
                erros={erros}
                aoAlternarExpandir={() => aoAlternarExpandirPessoa(pessoa.localId)}
                aoMudarCampo={(campo, valor) => aoMudarPessoa(indiceFlat, campo, valor)}
                aoMover={(direcao) => moverPessoa(pessoa.localId, direcao)}
                aoRemover={() => aoRemoverPessoa(indiceFlat)}
              />
            ))}
          </div>
        ))}
        <Button
          type="button"
          label="Adicionar pessoa"
          onClick={aoAdicionarPessoa}
          pt={{ root: { className: styles.botaoSecundario } }}
        />
      </div>

      <div className={`${styles.acoes} ${modoEdicao && aoExcluir ? styles.acoesComExcluir : ""}`}>
        {modoEdicao && aoExcluir && (
          <button
            type="button"
            className={styles.botaoPerigo}
            onClick={() => setConfirmandoExclusao(true)}
          >
            <Trash2 size={16} strokeWidth={1.5} aria-hidden="true" />
            Excluir atividade
          </button>
        )}
        <div className={styles.acoesPrincipais}>
          <Button
            type="button"
            label="Cancelar"
            onClick={aoCancelar}
            pt={{ root: { className: styles.botaoSecundario } }}
          />
          <Button
            type="submit"
            label={salvando ? "Aguarde..." : modoEdicao ? "Salvar" : "Criar atividade"}
            disabled={salvando}
            pt={{ root: { className: styles.botaoPrimario } }}
          />
        </div>
      </div>
    </form>
    {confirmandoExclusao && (
      <ModalConfirmacao
        titulo="Excluir atividade"
        mensagem={`Tem certeza que deseja excluir "${atividadeInicial?.nome}"? Essa ação não pode ser desfeita.`}
        confirmando={excluindo}
        onConfirmar={aoConfirmarExclusao}
        onCancelar={() => setConfirmandoExclusao(false)}
      />
    )}
    </>
  );
}
