"use client";

import { useEffect, useRef, useState } from "react";
import { Check, CircleCheck } from "lucide-react";
import Botao from "@/components/forms/Botao";
import Modal from "./Modal";
import CamposAdaptacao, { ADAPTACAO_VAZIA } from "./CamposAdaptacao";
import SeletorAtividadesInscricao from "./SeletorAtividadesInscricao";
import CardContribuicaoParticipante, { temContribuicao } from "./CardContribuicaoParticipante";
import CartaoInscricaoParticipante from "./CartaoInscricaoParticipante";
import { useToast } from "./ToastProvider";
import { adaptacaoInscricaoSchema, extrairErros } from "@/lib/validacao";
import { salvarInscricao } from "@/lib/participanteInscricoes";
import { paraNumeroRomano } from "@/lib/romanos";
import styles from "./ModalInscricao.module.scss";

function plural(n, singular, plural) {
  return `${n} ${n === 1 ? singular : plural}`;
}

// Passo a passo da primeira inscrição na edição:
//   1. Acessibilidade (obrigatória)
//   2. Atividades com inscrição — pode escolher depois (some se não houver)
//   3. Contribuição voluntária — pulável (some sem texto cadastrado)
//   4. Comprovante
// Nada é gravado até o fim do passo 2 (ou do 1, sem atividades): a inscrição
// geral e as atividades vão juntas num único POST — uma transação e um só
// e-mail de comprovante. Daí em diante a inscrição já existe, então não há
// "Voltar" e fechar o modal não perde nada.
export default function ModalInscricao({
  edicao,
  atividades = [],
  apresentacoes = [],
  nomeParticipante,
  onInscrito,
  onFechar,
}) {
  const { notificar } = useToast();
  // Os passos ficam fixos na abertura: depois de inscrever, a página recarrega
  // e a lista de atividades disponíveis muda — não pode sumir um passo no meio.
  const [passos] = useState(() =>
    [
      { chave: "adaptacao", rotulo: "Acessibilidade" },
      atividades.length > 0 && { chave: "atividades", rotulo: "Atividades" },
      temContribuicao(edicao) && { chave: "contribuicao", rotulo: "Contribuição" },
      { chave: "comprovante", rotulo: "Comprovante" },
    ].filter(Boolean),
  );
  const [indice, setIndice] = useState(0);
  const [adaptacao, setAdaptacao] = useState(ADAPTACAO_VAZIA);
  const [errosAdaptacao, setErrosAdaptacao] = useState({});
  const [selecionadas, setSelecionadas] = useState(() => new Set());
  const [enviando, setEnviando] = useState(false);
  const [inscricao, setInscricao] = useState(null);
  const tituloPassoRef = useRef(null);
  const primeiraRenderizacao = useRef(true);

  const passo = passos[indice];
  // Último passo antes de gravar: Atividades, ou Acessibilidade quando não há atividades.
  const indiceAtividades = passos.findIndex((item) => item.chave === "atividades");
  const indiceEnvio = indiceAtividades === -1 ? 0 : indiceAtividades;
  const passoDeEnvio = indice === indiceEnvio;

  // Ao trocar de passo, o foco vai para o título dele (leitor de tela anuncia
  // e a rolagem do modal volta para o topo).
  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    tituloPassoRef.current?.focus();
  }, [indice]);

  function validarAdaptacao() {
    const resultado = adaptacaoInscricaoSchema.safeParse(adaptacao);
    if (!resultado.success) {
      setErrosAdaptacao(extrairErros(resultado));
      return null;
    }
    setErrosAdaptacao({});
    return resultado.data;
  }


  async function confirmarInscricao() {
    const dadosAdaptacao = validarAdaptacao();
    if (!dadosAdaptacao) {
      setIndice(0);
      return;
    }
    setEnviando(true);
    try {
      const resultado = await salvarInscricao(edicao.id, [...selecionadas], dadosAdaptacao);
      setInscricao(resultado);
      notificar("Inscrição confirmada com sucesso.");
      onInscrito?.();
      setIndice((atual) => atual + 1);
    } catch (erro) {
      notificar(erro.message, "erro");
      // Vagas e conflitos podem ter mudado: a página busca a lista de novo.
      onInscrito?.();
    } finally {
      setEnviando(false);
    }
  }

  function avancar() {
    if (passo.chave === "adaptacao" && !validarAdaptacao()) return;
    if (passoDeEnvio) {
      confirmarInscricao();
      return;
    }
    setIndice((atual) => atual + 1);
  }

  function rotuloAvancar() {
    if (passoDeEnvio) {
      if (passo.chave !== "atividades") return "Confirmar inscrição";
      return selecionadas.size > 0
        ? `Confirmar inscrição · ${plural(selecionadas.size, "atividade", "atividades")}`
        : "Confirmar e escolher depois";
    }
    if (passo.chave === "contribuicao") return "Ir para o comprovante";
    if (passo.chave === "comprovante") return "Concluir";
    return "Continuar";
  }

  const inscrito = Boolean(inscricao);
  // Mensagem de sucesso no primeiro passo depois de gravar.
  const primeiroPassoInscrito = inscrito && indice === indiceEnvio + 1;

  const rodape = (
    <>
      {!inscrito && indice > 0 && (
        <Botao type="button" variante="secundario" onClick={() => setIndice((atual) => atual - 1)} disabled={enviando}>
          Voltar
        </Botao>
      )}
      <Botao type="button" carregando={enviando} onClick={passo.chave === "comprovante" ? onFechar : avancar}>
        {rotuloAvancar()}
      </Botao>
    </>
  );

  return (
    <Modal titulo="Inscrição" onFechar={onFechar} rodape={rodape} telaCheiaNoCelular>
      <div className={styles.corpo}>
        <ol className={styles.passos} aria-label="Etapas da inscrição">
          {passos.map((item, posicao) => {
            const feito = posicao < indice;
            const atual = posicao === indice;
            return (
              <li
                key={item.chave}
                className={`${styles.passo} ${feito ? styles.passoFeito : ""} ${atual ? styles.passoAtual : ""}`}
                aria-current={atual ? "step" : undefined}
              >
                <span className={styles.marcador} aria-hidden="true">
                  {feito ? <Check size={14} strokeWidth={2.5} /> : posicao + 1}
                </span>
                <span className={styles.rotuloPasso}>{item.rotulo}</span>
              </li>
            );
          })}
        </ol>

        <p className={styles.contador}>
          Passo {indice + 1} de {passos.length}
        </p>

        {primeiroPassoInscrito && (
          <p className={styles.sucesso} role="status">
            <CircleCheck size={18} strokeWidth={1.5} aria-hidden="true" />
            Inscrição confirmada! Também enviamos o comprovante para o seu e-mail.
          </p>
        )}

        {passo.chave === "adaptacao" && (
          <section className={styles.secao} aria-labelledby="passo-titulo">
            <h3 id="passo-titulo" ref={tituloPassoRef} tabIndex={-1} className={styles.tituloPasso}>
              {paraNumeroRomano(edicao.numero)} — {edicao.nome}
            </h3>
            <p className={styles.texto}>
              Para começar, conte se precisa de alguma adaptação ou recurso. A organização usa essa resposta para
              preparar o evento, e você pode alterá-la depois.
            </p>
            <CamposAdaptacao
              id="adaptacao-inscricao"
              valor={adaptacao}
              onChange={setAdaptacao}
              erros={errosAdaptacao}
            />
          </section>
        )}

        {passo.chave === "atividades" && (
          <section className={styles.secao} aria-labelledby="passo-titulo">
            <h3 id="passo-titulo" ref={tituloPassoRef} tabIndex={-1} className={styles.tituloPasso}>
              Escolha as atividades
            </h3>
            <p className={styles.texto}>
              Estas atividades têm vagas limitadas e exigem inscrição; as demais da programação são abertas. Marque
              uma por horário — ou escolha depois, na página da sua inscrição.
            </p>
            <SeletorAtividadesInscricao
              atividades={atividades}
              selecionadas={selecionadas}
              onMudar={setSelecionadas}
            />
          </section>
        )}

        {passo.chave === "contribuicao" && (
          <section className={styles.secao} aria-labelledby="passo-titulo">
            <h3 id="passo-titulo" ref={tituloPassoRef} tabIndex={-1} className={styles.tituloPasso}>
              {edicao.tituloContribuicao || "Contribuição voluntária"}
            </h3>
            <CardContribuicaoParticipante edicao={edicao} embutido />
            <p className={styles.apoio}>A contribuição é opcional — sua inscrição já está confirmada.</p>
          </section>
        )}

        {passo.chave === "comprovante" && inscricao && (
          <section className={styles.secao} aria-labelledby="passo-titulo">
            <h3 id="passo-titulo" ref={tituloPassoRef} tabIndex={-1} className={styles.tituloPasso}>
              Seu comprovante
            </h3>
            <p className={styles.texto}>
              O QR code abaixo é o seu crachá: mostre-o na entrada do evento e nas atividades com inscrição. Ele fica
              sempre disponível em Credenciamento.
            </p>
            <CartaoInscricaoParticipante
              edicao={edicao}
              inscricoesAtividade={inscricao.inscricoesAtividade}
              apresentacoes={apresentacoes}
              nomeParticipante={nomeParticipante}
            />
          </section>
        )}
      </div>
    </Modal>
  );
}
