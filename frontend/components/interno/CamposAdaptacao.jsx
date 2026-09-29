"use client";

import CampoRadioSecao from "./CampoRadioSecao";
import CampoArea from "./CampoArea";

const OPCOES = [
  { valor: "SIM", rotulo: "Sim" },
  { valor: "NAO", rotulo: "Não" },
];

export const ADAPTACAO_VAZIA = { precisaAdaptacao: null, adaptacoesNecessarias: "" };

// Pergunta de acessibilidade da inscrição geral (validada por
// adaptacaoInscricaoSchema em lib/validacao.js). Controlado: `valor` é
// { precisaAdaptacao: true | false | null, adaptacoesNecessarias: string }.
// A segunda pergunta só aparece com "Sim".
const PERGUNTA_PADRAO = "Você necessita de alguma adaptação ou recurso específico para participar do evento?";

export default function CamposAdaptacao({ id, valor, onChange, erros = {}, pergunta = PERGUNTA_PADRAO }) {
  const escolha = valor.precisaAdaptacao === true ? "SIM" : valor.precisaAdaptacao === false ? "NAO" : null;

  return (
    <>
      <CampoRadioSecao
        id={`${id}-precisa`}
        rotulo={pergunta}
        valor={escolha}
        onChange={(opcao) => onChange({ ...valor, precisaAdaptacao: opcao === "SIM" })}
        opcoes={OPCOES}
        erro={erros.precisaAdaptacao}
      />
      {valor.precisaAdaptacao === true && (
        <CampoArea
          id={`${id}-quais`}
          rotulo="Indique as adaptações ou recursos dos quais necessita"
          linhas={4}
          maxLength={2000}
          value={valor.adaptacoesNecessarias}
          onChange={(evento) => onChange({ ...valor, adaptacoesNecessarias: evento.target.value })}
          erro={erros.adaptacoesNecessarias}
        />
      )}
    </>
  );
}
