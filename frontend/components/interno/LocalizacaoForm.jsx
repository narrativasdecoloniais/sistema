"use client";

import { useState } from "react";
import { z } from "zod";
import { useToast } from "./ToastProvider";
import { apiClient } from "@/lib/apiClient";
import { edicaoPontoInteresseSchema, extrairErros } from "@/lib/validacao";
import ModalConfirmacao from "./ModalConfirmacao";
import SecaoLocalizacao, { chavePonto } from "./SecaoLocalizacao";
import styles from "./EdicaoForm.module.scss";

const localizacaoSchema = z.object({
  pontosInteresse: z.array(edicaoPontoInteresseSchema).optional(),
  corFundoLocalizacao: z.string().optional(),
  opacidadeFundoLocalizacao: z.number().int().min(0).max(100).optional(),
  corTextoLocalizacao: z.string().optional(),
  mostrarFaixaLocalizacao: z.boolean().optional(),
  introducaoLocalizacao: z.string().trim().max(600, "Use no máximo 600 caracteres").optional(),
  textosTiposLocalizacao: z
    .record(z.string(), z.string().trim().max(800, "Use no máximo 800 caracteres"))
    .optional(),
});

function pontoParaPayload(ponto) {
  const payload = {
    tipoId: ponto.tipoId,
    nome: ponto.nome.trim(),
    grupo: ponto.grupo?.trim() || undefined,
    descricao: ponto.descricao?.trim() || undefined,
    endereco: ponto.endereco?.trim() || undefined,
    latitude: ponto.latitude,
    longitude: ponto.longitude,
    aproximado: Boolean(ponto.aproximado),
    link: ponto.link?.trim() || undefined,
  };
  if (ponto.id) payload.id = ponto.id;
  if (ponto.imagem === null || (ponto.imagem && ponto.imagem.startsWith("data:image/"))) {
    payload.imagem = ponto.imagem;
  }
  return payload;
}

export default function LocalizacaoForm({ edicaoInicial, tiposPontoInteresse = [] }) {
  const { notificar } = useToast();
  const [pontosInteresse, setPontosInteresse] = useState(edicaoInicial.pontosInteresse || []);
  const [corFundo, setCorFundo] = useState(edicaoInicial.corFundoLocalizacao || "PAPEL");
  const [opacidade, setOpacidade] = useState(edicaoInicial.opacidadeFundoLocalizacao ?? 100);
  const [corTexto, setCorTexto] = useState(edicaoInicial.corTextoLocalizacao || "TINTA");
  const [mostrarFaixa, setMostrarFaixa] = useState(edicaoInicial.mostrarFaixaLocalizacao ?? true);
  const [introducao, setIntroducao] = useState(edicaoInicial.introducaoLocalizacao || "");
  const [textosTipos, setTextosTipos] = useState(edicaoInicial.textosTiposLocalizacao || {});
  const [expandidos, setExpandidos] = useState(() => new Set());
  const [erros, setErros] = useState({});
  const [indiceConfirmandoRemocao, setIndiceConfirmandoRemocao] = useState(null);
  const [removendo, setRemovendo] = useState(false);

  async function salvar(overrides = {}) {
    const pontosEnviados = overrides.pontosInteresse ?? pontosInteresse;
    const resultado = localizacaoSchema.safeParse({
      pontosInteresse: pontosEnviados.map(pontoParaPayload),
      corFundoLocalizacao: overrides.corFundoLocalizacao ?? corFundo,
      opacidadeFundoLocalizacao: overrides.opacidadeFundoLocalizacao ?? opacidade,
      corTextoLocalizacao: overrides.corTextoLocalizacao ?? corTexto,
      mostrarFaixaLocalizacao: overrides.mostrarFaixaLocalizacao ?? mostrarFaixa,
      introducaoLocalizacao: overrides.introducaoLocalizacao ?? introducao,
      textosTiposLocalizacao: overrides.textosTiposLocalizacao ?? textosTipos,
    });
    if (!resultado.success) {
      const novosErros = extrairErros(resultado);
      setErros(novosErros);
      // Abre os cartões com erro — recolhidos, o erro ficaria escondido.
      setExpandidos((atual) => {
        const proximo = new Set(atual);
        pontosEnviados.forEach((ponto, indice) => {
          if (Object.keys(novosErros).some((chave) => chave.startsWith(`pontosInteresse.${indice}.`))) {
            proximo.add(chavePonto(ponto, indice));
          }
        });
        return proximo;
      });
      return;
    }
    setErros({});

    try {
      const resposta = await apiClient.patch(`/edicoes/${edicaoInicial.id}`, {
        numero: edicaoInicial.numero,
        nome: edicaoInicial.nome,
        ...resultado.data,
      });
      const pontosSalvos = resposta.edicao.pontosInteresse || [];
      // Ponto novo ganha id no primeiro salvamento: o cartão aberto continua
      // aberto (a resposta vem na mesma ordem do que foi enviado).
      setExpandidos((atual) => {
        const proximo = new Set(atual);
        pontosEnviados.forEach((ponto, indice) => {
          const chaveNova = `novo-${indice}`;
          if (!ponto.id && proximo.has(chaveNova)) {
            proximo.delete(chaveNova);
            if (pontosSalvos[indice]) proximo.add(pontosSalvos[indice].id);
          }
        });
        return proximo;
      });
      setPontosInteresse(pontosSalvos);
      setCorFundo(resposta.edicao.corFundoLocalizacao);
      setOpacidade(resposta.edicao.opacidadeFundoLocalizacao);
      setCorTexto(resposta.edicao.corTextoLocalizacao);
      setMostrarFaixa(resposta.edicao.mostrarFaixaLocalizacao);
      setIntroducao(resposta.edicao.introducaoLocalizacao || "");
      setTextosTipos(resposta.edicao.textosTiposLocalizacao || {});
      notificar("Página do evento atualizada com sucesso.");
    } catch (erro) {
      notificar(erro.message, "erro");
    }
  }

  function aoMudarCorFundo(valor) {
    setCorFundo(valor);
    salvar({ corFundoLocalizacao: valor });
  }

  function aoMudarOpacidade(valor) {
    setOpacidade(valor);
    salvar({ opacidadeFundoLocalizacao: valor });
  }

  function aoMudarCorTexto(valor) {
    setCorTexto(valor);
    salvar({ corTextoLocalizacao: valor });
  }

  function aoMudarMostrarFaixa(valor) {
    setMostrarFaixa(valor);
    salvar({ mostrarFaixaLocalizacao: valor });
  }

  function aoMudarTextoTipo(tipoId, texto) {
    setTextosTipos((atual) => ({ ...atual, [tipoId]: texto }));
  }

  // `salvarAgora` para mudanças sem blur (seleção, checkbox, foto) — o
  // salvamento usa a lista nova direto, sem esperar o estado atualizar.
  function aoMudarPonto(indice, campo, valor, salvarAgora = false) {
    const novo = pontosInteresse.map((ponto, i) => (i === indice ? { ...ponto, [campo]: valor } : ponto));
    setPontosInteresse(novo);
    if (salvarAgora) salvar({ pontosInteresse: novo });
  }

  function aoAlternarPonto(chave) {
    setExpandidos((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(chave)) proximo.delete(chave);
      else proximo.add(chave);
      return proximo;
    });
  }

  // Troca o ponto de posição com o vizinho da mesma categoria; a ordem do
  // array é a ordem salva (EdicaoPontoInteresse.ordem).
  function aoMoverPonto(indice, indiceVizinho) {
    if (indiceVizinho === undefined) return;
    const chaveA = chavePonto(pontosInteresse[indice], indice);
    const chaveB = chavePonto(pontosInteresse[indiceVizinho], indiceVizinho);
    const novo = [...pontosInteresse];
    [novo[indice], novo[indiceVizinho]] = [novo[indiceVizinho], novo[indice]];
    // Pontos ainda sem id são identificados pela posição: troca a marca de
    // aberto junto com eles.
    setExpandidos((atual) => {
      const proximo = new Set(atual);
      const abertoA = atual.has(chaveA);
      const abertoB = atual.has(chaveB);
      proximo.delete(chaveA);
      proximo.delete(chaveB);
      if (abertoA) proximo.add(chavePonto(novo[indiceVizinho], indiceVizinho));
      if (abertoB) proximo.add(chavePonto(novo[indice], indice));
      return proximo;
    });
    setPontosInteresse(novo);
    salvar({ pontosInteresse: novo });
  }

  function aoAdicionarPonto(tipoId) {
    // Entra logo depois do último ponto da categoria, pra aparecer no fim dela.
    let posicao = pontosInteresse.length;
    pontosInteresse.forEach((ponto, indice) => {
      if (ponto.tipoId === tipoId) posicao = indice + 1;
    });
    const novo = [...pontosInteresse];
    novo.splice(posicao, 0, {
      tipoId,
      nome: "",
      grupo: "",
      descricao: "",
      imagem: null,
      endereco: "",
      latitude: null,
      longitude: null,
      aproximado: false,
      link: "",
    });
    // Pontos novos depois da posição inserida mudam de chave (novo-N).
    setExpandidos((atual) => {
      const proximo = new Set();
      atual.forEach((chave) => {
        const indiceNovo = chave.startsWith("novo-") ? Number(chave.slice(5)) : null;
        proximo.add(indiceNovo !== null && indiceNovo >= posicao ? `novo-${indiceNovo + 1}` : chave);
      });
      proximo.add(`novo-${posicao}`);
      return proximo;
    });
    setPontosInteresse(novo);
  }

  async function confirmarRemocao() {
    setRemovendo(true);
    const novo = pontosInteresse.filter((_, i) => i !== indiceConfirmandoRemocao);
    await salvar({ pontosInteresse: novo });
    setPontosInteresse(novo);
    setRemovendo(false);
    setIndiceConfirmandoRemocao(null);
  }

  return (
    <div className={styles.formulario}>
      <SecaoLocalizacao
        pontos={pontosInteresse}
        tipos={tiposPontoInteresse}
        corFundo={corFundo}
        opacidade={opacidade}
        corTexto={corTexto}
        mostrarFaixa={mostrarFaixa}
        introducao={introducao}
        textosTipos={textosTipos}
        expandidos={expandidos}
        erros={erros}
        aoMudarPonto={aoMudarPonto}
        aoMudarCorFundo={aoMudarCorFundo}
        aoMudarOpacidade={aoMudarOpacidade}
        aoMudarCorTexto={aoMudarCorTexto}
        aoMudarMostrarFaixa={aoMudarMostrarFaixa}
        aoMudarIntroducao={setIntroducao}
        aoMudarTextoTipo={aoMudarTextoTipo}
        aoAlternarPonto={aoAlternarPonto}
        aoMoverPonto={aoMoverPonto}
        aoSalvar={() => salvar({})}
        aoAdicionarPonto={aoAdicionarPonto}
        aoPedirRemocao={setIndiceConfirmandoRemocao}
      />
      {indiceConfirmandoRemocao !== null && (
        <ModalConfirmacao
          titulo="Excluir ponto de interesse"
          mensagem={`Tem certeza que deseja excluir "${pontosInteresse[indiceConfirmandoRemocao]?.nome || "este ponto"}"? Essa ação não pode ser desfeita.`}
          confirmando={removendo}
          onConfirmar={confirmarRemocao}
          onCancelar={() => setIndiceConfirmandoRemocao(null)}
        />
      )}
    </div>
  );
}
