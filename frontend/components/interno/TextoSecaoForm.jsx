"use client";

import { useState } from "react";
import { z } from "zod";
import { Info, LayoutGrid, Newspaper, IdCard, MousePointerClick } from "lucide-react";
import { useToast } from "./ToastProvider";
import { apiClient } from "@/lib/apiClient";
import { extrairErros } from "@/lib/validacao";
import CampoTexto from "./CampoTexto";
import CampoArea from "./CampoArea";
import CampoCorSecao, { OPCOES_COR_PUBLICA } from "./CampoCorSecao";
import CampoOpacidade from "./CampoOpacidade";
import CampoCheckbox from "./CampoCheckbox";
import CabecalhoSecao from "./CabecalhoSecao";
import { contraste } from "@/lib/contraste";
import styles from "./EdicaoForm.module.scss";

const PALETA_FUNDO = ["PAPEL", "TINTA", "BARRO", "OCRE", "CERRADO"];
const PALETA_PUBLICA = ["TINTA", "BARRO", "OCRE", "BUZIO", "AREIA", "PAPEL", "CERRADO"];
const LIMIAR_CONTRASTE_BOTAO = 4.5;

function corPorValor(valor) {
  return OPCOES_COR_PUBLICA.find((opcao) => opcao.valor === valor)?.cor;
}

// Componentes de ícone não podem ser passados de Server pra Client Component
// via prop (não são serializáveis) — por isso o mapa mora aqui dentro,
// indexado pelo mesmo `campo` que as páginas de cada dobra já passam.
const ICONES = {
  Apresentacao: Info,
  Modalidades: LayoutGrid,
  Publicacoes: Newspaper,
};

// Reaproveitado pelas 3 dobras da página pública que só precisam de
// título + corpo de texto + cor de fundo (Apresentação, Modalidades,
// Publicações) — `campo` é o prefixo dos 3 campos no model Edicao
// (ex. "Apresentacao" -> tituloApresentacao/corpoApresentacao/corFundoApresentacao).
// `temCard` liga um segundo bloco de cores pros cards dentro da seção (só
// Modalidades tem — Apresentação/Publicações não têm cards, ver
// pagina/modalidades/page.jsx). `temBotao` liga um bloco à parte pro par de
// cor do botão da seção — independente de `temCard`: em Modalidades o botão
// mora dentro do card (.modalidadeCtaPrimario/.modalidadeLink, campo
// `corFundoBotaoCard*`), em Apresentação os botões (Inscreva-se/Conheça o
// GPDES) ficam soltos na seção, sem card por trás (campo `corFundoBotao*`,
// sem "Card" no nome). Publicações/Agenda não têm botão de verdade — o link
// de Agenda não tem preenchimento, então não corre risco de ficar invisível.
export default function TextoSecaoForm({
  edicaoInicial,
  campo,
  titulo,
  descricao,
  temCard = false,
  temBotao = false,
}) {
  const Icone = ICONES[campo];
  const { notificar } = useToast();
  const campoTitulo = `titulo${campo}`;
  const campoCorpo = `corpo${campo}`;
  const campoCorFundo = `corFundo${campo}`;
  const campoOpacidade = `opacidadeFundo${campo}`;
  const campoCorTexto = `corTexto${campo}`;
  const campoCorBuzio = `corBuzio${campo}`;
  const campoMostrarFaixa = `mostrarFaixa${campo}`;
  const campoCorFundoCard = `corFundoCard${campo}`;
  const campoOpacidadeCard = `opacidadeFundoCard${campo}`;
  const campoCorTextoCard = `corTextoCard${campo}`;
  const campoCorTextoSecundarioCard = `corTextoSecundarioCard${campo}`;
  const campoCorAcentoCard = `corAcentoCard${campo}`;
  // Só leva "Card" no nome quando o botão de fato mora dentro de um card
  // (Modalidades) — solto na seção (Apresentação), o campo é só `corFundoBotao*`.
  const campoCorFundoBotaoCard = temCard ? `corFundoBotaoCard${campo}` : `corFundoBotao${campo}`;
  const campoCorTextoBotaoCard = temCard ? `corTextoBotaoCard${campo}` : `corTextoBotao${campo}`;

  const schema = z.object({
    [campoTitulo]: z.string().trim().optional(),
    [campoCorpo]: z.string().trim().optional(),
    [campoCorFundo]: z.enum(PALETA_FUNDO).optional(),
    [campoOpacidade]: z.number().int().min(0).max(100).optional(),
    [campoCorTexto]: z.enum(PALETA_PUBLICA).optional(),
    [campoCorBuzio]: z.enum(PALETA_PUBLICA).optional(),
    [campoMostrarFaixa]: z.boolean().optional(),
    ...(temCard
      ? {
          [campoCorFundoCard]: z.enum(PALETA_FUNDO).optional(),
          [campoOpacidadeCard]: z.number().int().min(0).max(100).optional(),
          [campoCorTextoCard]: z.enum(PALETA_PUBLICA).optional(),
          [campoCorTextoSecundarioCard]: z.enum(PALETA_PUBLICA).optional(),
          [campoCorAcentoCard]: z.enum(PALETA_PUBLICA).optional(),
        }
      : {}),
    ...(temBotao
      ? {
          [campoCorFundoBotaoCard]: z.enum(PALETA_PUBLICA).optional(),
          [campoCorTextoBotaoCard]: z.enum(PALETA_PUBLICA).optional(),
        }
      : {}),
  });

  const [valorTitulo, setValorTitulo] = useState(edicaoInicial[campoTitulo] || "");
  const [valorCorpo, setValorCorpo] = useState(edicaoInicial[campoCorpo] || "");
  const [corFundo, setCorFundo] = useState(edicaoInicial[campoCorFundo] || "PAPEL");
  const [opacidade, setOpacidade] = useState(edicaoInicial[campoOpacidade] ?? 100);
  const [corTexto, setCorTexto] = useState(edicaoInicial[campoCorTexto] || "TINTA");
  const [corBuzio, setCorBuzio] = useState(edicaoInicial[campoCorBuzio] || "BUZIO");
  const [mostrarFaixa, setMostrarFaixa] = useState(edicaoInicial[campoMostrarFaixa] ?? true);
  const [corFundoCard, setCorFundoCard] = useState(edicaoInicial[campoCorFundoCard] || "OCRE");
  const [opacidadeCard, setOpacidadeCard] = useState(edicaoInicial[campoOpacidadeCard] ?? 6);
  const [corTextoCard, setCorTextoCard] = useState(edicaoInicial[campoCorTextoCard] || "TINTA");
  const [corTextoSecundarioCard, setCorTextoSecundarioCard] = useState(
    edicaoInicial[campoCorTextoSecundarioCard] || "TINTA"
  );
  const [corAcentoCard, setCorAcentoCard] = useState(edicaoInicial[campoCorAcentoCard] || "BARRO");
  const [corFundoBotaoCard, setCorFundoBotaoCard] = useState(
    edicaoInicial[campoCorFundoBotaoCard] || "BARRO"
  );
  const [corTextoBotaoCard, setCorTextoBotaoCard] = useState(
    edicaoInicial[campoCorTextoBotaoCard] || "PAPEL"
  );
  const [erros, setErros] = useState({});

  async function salvar(overrides = {}) {
    const resultado = schema.safeParse({
      [campoTitulo]: overrides[campoTitulo] ?? valorTitulo,
      [campoCorpo]: overrides[campoCorpo] ?? valorCorpo,
      [campoCorFundo]: overrides[campoCorFundo] ?? corFundo,
      [campoOpacidade]: overrides[campoOpacidade] ?? opacidade,
      [campoCorTexto]: overrides[campoCorTexto] ?? corTexto,
      [campoCorBuzio]: overrides[campoCorBuzio] ?? corBuzio,
      [campoMostrarFaixa]: overrides[campoMostrarFaixa] ?? mostrarFaixa,
      ...(temCard
        ? {
            [campoCorFundoCard]: overrides[campoCorFundoCard] ?? corFundoCard,
            [campoOpacidadeCard]: overrides[campoOpacidadeCard] ?? opacidadeCard,
            [campoCorTextoCard]: overrides[campoCorTextoCard] ?? corTextoCard,
            [campoCorTextoSecundarioCard]: overrides[campoCorTextoSecundarioCard] ?? corTextoSecundarioCard,
            [campoCorAcentoCard]: overrides[campoCorAcentoCard] ?? corAcentoCard,
          }
        : {}),
      ...(temBotao
        ? {
            [campoCorFundoBotaoCard]: overrides[campoCorFundoBotaoCard] ?? corFundoBotaoCard,
            [campoCorTextoBotaoCard]: overrides[campoCorTextoBotaoCard] ?? corTextoBotaoCard,
          }
        : {}),
    });
    if (!resultado.success) {
      setErros(extrairErros(resultado));
      return;
    }
    setErros({});

    try {
      const resposta = await apiClient.patch(`/edicoes/${edicaoInicial.id}`, {
        numero: edicaoInicial.numero,
        nome: edicaoInicial.nome,
        ...resultado.data,
      });
      setValorTitulo(resposta.edicao[campoTitulo] || "");
      setValorCorpo(resposta.edicao[campoCorpo] || "");
      setCorFundo(resposta.edicao[campoCorFundo]);
      setOpacidade(resposta.edicao[campoOpacidade]);
      setCorTexto(resposta.edicao[campoCorTexto]);
      setCorBuzio(resposta.edicao[campoCorBuzio]);
      setMostrarFaixa(resposta.edicao[campoMostrarFaixa]);
      if (temCard) {
        setCorFundoCard(resposta.edicao[campoCorFundoCard]);
        setOpacidadeCard(resposta.edicao[campoOpacidadeCard]);
        setCorTextoCard(resposta.edicao[campoCorTextoCard]);
        setCorTextoSecundarioCard(resposta.edicao[campoCorTextoSecundarioCard]);
        setCorAcentoCard(resposta.edicao[campoCorAcentoCard]);
      }
      if (temBotao) {
        setCorFundoBotaoCard(resposta.edicao[campoCorFundoBotaoCard]);
        setCorTextoBotaoCard(resposta.edicao[campoCorTextoBotaoCard]);
      }
      notificar("Página do evento atualizada com sucesso.");
    } catch (erro) {
      notificar(erro.message, "erro");
    }
  }

  function aoMudarCorFundo(valor) {
    setCorFundo(valor);
    salvar({ [campoCorFundo]: valor });
  }

  function aoMudarOpacidade(valor) {
    setOpacidade(valor);
    salvar({ [campoOpacidade]: valor });
  }

  function aoMudarCorTexto(valor) {
    setCorTexto(valor);
    salvar({ [campoCorTexto]: valor });
  }

  function aoMudarCorBuzio(valor) {
    setCorBuzio(valor);
    salvar({ [campoCorBuzio]: valor });
  }

  function aoMudarMostrarFaixa(valor) {
    setMostrarFaixa(valor);
    salvar({ [campoMostrarFaixa]: valor });
  }

  function aoMudarCorFundoCard(valor) {
    setCorFundoCard(valor);
    salvar({ [campoCorFundoCard]: valor });
  }

  function aoMudarOpacidadeCard(valor) {
    setOpacidadeCard(valor);
    salvar({ [campoOpacidadeCard]: valor });
  }

  function aoMudarCorTextoCard(valor) {
    setCorTextoCard(valor);
    salvar({ [campoCorTextoCard]: valor });
  }

  function aoMudarCorTextoSecundarioCard(valor) {
    setCorTextoSecundarioCard(valor);
    salvar({ [campoCorTextoSecundarioCard]: valor });
  }

  function aoMudarCorAcentoCard(valor) {
    setCorAcentoCard(valor);
    salvar({ [campoCorAcentoCard]: valor });
  }

  function aoMudarCorFundoBotaoCard(valor) {
    setCorFundoBotaoCard(valor);
    salvar({ [campoCorFundoBotaoCard]: valor });
  }

  function aoMudarCorTextoBotaoCard(valor) {
    setCorTextoBotaoCard(valor);
    salvar({ [campoCorTextoBotaoCard]: valor });
  }

  const contrasteBotao =
    temBotao && corFundoBotaoCard && corTextoBotaoCard
      ? contraste(corPorValor(corFundoBotaoCard), corPorValor(corTextoBotaoCard))
      : null;

  return (
    <div className={styles.formulario}>
      <div className={styles.secao}>
        <CabecalhoSecao Icone={Icone} titulo={titulo} descricao={descricao} />
        <div className={styles.camposSecao}>
          <CampoTexto
            id={campoTitulo}
            rotulo="Título"
            value={valorTitulo}
            onChange={(evento) => setValorTitulo(evento.target.value)}
            onBlur={() => salvar()}
            erro={erros[campoTitulo]}
          />
          <CampoArea
            id={campoCorpo}
            rotulo="Texto"
            linhas={8}
            value={valorCorpo}
            onChange={(evento) => setValorCorpo(evento.target.value)}
            onBlur={() => salvar()}
            erro={erros[campoCorpo]}
          />
          <CampoCorSecao
            id={campoCorFundo}
            rotulo="Cor de fundo da seção"
            valor={corFundo}
            onChange={aoMudarCorFundo}
          />
          <CampoOpacidade
            id={campoOpacidade}
            rotulo="Opacidade do fundo"
            valor={opacidade}
            onChange={aoMudarOpacidade}
          />
          <CampoCorSecao
            id={campoCorTexto}
            rotulo="Cor do texto"
            valor={corTexto}
            opcoes={OPCOES_COR_PUBLICA}
            onChange={aoMudarCorTexto}
          />
          <CampoCorSecao
            id={campoCorBuzio}
            rotulo="Cor do búzio"
            valor={corBuzio}
            opcoes={OPCOES_COR_PUBLICA}
            onChange={aoMudarCorBuzio}
          />
          <CampoCheckbox
            id={campoMostrarFaixa}
            rotulo="Mostrar a faixa lateral (definida no Hero) enquanto esta seção está em tela"
            checked={mostrarFaixa}
            onChange={aoMudarMostrarFaixa}
          />
        </div>
      </div>

      {temCard && (
        <div className={styles.secao}>
          <CabecalhoSecao
            Icone={IdCard}
            titulo="Cards de modalidade"
            descricao="Cores dos cards exibidos dentro desta seção."
          />
          <div className={styles.camposSecao}>
            <CampoCorSecao
              id={campoCorFundoCard}
              rotulo="Cor de fundo dos cards"
              valor={corFundoCard}
              onChange={aoMudarCorFundoCard}
            />
            <CampoOpacidade
              id={campoOpacidadeCard}
              rotulo="Opacidade do fundo dos cards"
              valor={opacidadeCard}
              onChange={aoMudarOpacidadeCard}
            />
            <CampoCorSecao
              id={campoCorTextoCard}
              rotulo="Cor do texto (título e resumo)"
              valor={corTextoCard}
              opcoes={OPCOES_COR_PUBLICA}
              onChange={aoMudarCorTextoCard}
            />
            <CampoCorSecao
              id={campoCorTextoSecundarioCard}
              rotulo="Cor do texto secundário (subtítulo)"
              valor={corTextoSecundarioCard}
              opcoes={OPCOES_COR_PUBLICA}
              onChange={aoMudarCorTextoSecundarioCard}
            />
            <CampoCorSecao
              id={campoCorAcentoCard}
              rotulo="Cor de destaque (prazo)"
              valor={corAcentoCard}
              opcoes={OPCOES_COR_PUBLICA}
              onChange={aoMudarCorAcentoCard}
            />
          </div>
        </div>
      )}

      {temBotao && (
        <div className={styles.secao}>
          <CabecalhoSecao
            Icone={MousePointerClick}
            titulo="Botões"
            descricao="Cor dos botões desta seção — o botão secundário reaproveita a mesma cor em contorno."
          />
          <div className={styles.camposSecao}>
            <CampoCorSecao
              id={campoCorFundoBotaoCard}
              rotulo="Cor de fundo do botão"
              valor={corFundoBotaoCard}
              opcoes={OPCOES_COR_PUBLICA}
              onChange={aoMudarCorFundoBotaoCard}
            />
            <CampoCorSecao
              id={campoCorTextoBotaoCard}
              rotulo="Cor do texto do botão"
              valor={corTextoBotaoCard}
              opcoes={OPCOES_COR_PUBLICA}
              onChange={aoMudarCorTextoBotaoCard}
            />
            {contrasteBotao !== null && contrasteBotao < LIMIAR_CONTRASTE_BOTAO && (
              <p className={styles.avisoContraste}>
                Contraste baixo entre fundo e texto do botão ({contrasteBotao.toFixed(1)}:1 — mínimo recomendado {LIMIAR_CONTRASTE_BOTAO}:1). O botão pode ficar difícil de ler.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
