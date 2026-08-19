"use client";

import { useState } from "react";
import { CalendarRange, IdCard } from "lucide-react";
import { useToast } from "./ToastProvider";
import { apiClient } from "@/lib/apiClient";
import CampoCorSecao, { OPCOES_COR_PUBLICA } from "./CampoCorSecao";
import CampoOpacidade from "./CampoOpacidade";
import CampoCheckbox from "./CampoCheckbox";
import CabecalhoSecao from "./CabecalhoSecao";
import styles from "./EdicaoForm.module.scss";

// Só fundo/opacidade/texto/búzio são customizáveis aqui — título, subtítulo e
// as atividades listadas na seção "Agenda/Programação" da página pública já
// vêm da API de atividades, sem campo de texto próprio pra editar.
export default function AgendaForm({ edicaoInicial }) {
  const { notificar } = useToast();
  const [corFundoAgenda, setCorFundoAgenda] = useState(edicaoInicial.corFundoAgenda || "PAPEL");
  const [opacidadeFundoAgenda, setOpacidadeFundoAgenda] = useState(
    edicaoInicial.opacidadeFundoAgenda ?? 100
  );
  const [corTextoAgenda, setCorTextoAgenda] = useState(edicaoInicial.corTextoAgenda || "TINTA");
  const [corBuzioAgenda, setCorBuzioAgenda] = useState(edicaoInicial.corBuzioAgenda || "BUZIO");
  const [mostrarFaixaAgenda, setMostrarFaixaAgenda] = useState(
    edicaoInicial.mostrarFaixaAgenda ?? true
  );
  const [corFundoCardAgenda, setCorFundoCardAgenda] = useState(
    edicaoInicial.corFundoCardAgenda || "OCRE"
  );
  const [opacidadeFundoCardAgenda, setOpacidadeFundoCardAgenda] = useState(
    edicaoInicial.opacidadeFundoCardAgenda ?? 6
  );
  const [corTextoCardAgenda, setCorTextoCardAgenda] = useState(
    edicaoInicial.corTextoCardAgenda || "TINTA"
  );
  const [corTextoSecundarioCardAgenda, setCorTextoSecundarioCardAgenda] = useState(
    edicaoInicial.corTextoSecundarioCardAgenda || "TINTA"
  );
  const [corAcentoCardAgenda, setCorAcentoCardAgenda] = useState(
    edicaoInicial.corAcentoCardAgenda || "BARRO"
  );

  async function salvar(campos) {
    try {
      const resposta = await apiClient.patch(`/edicoes/${edicaoInicial.id}`, {
        numero: edicaoInicial.numero,
        nome: edicaoInicial.nome,
        ...campos,
      });
      setCorFundoAgenda(resposta.edicao.corFundoAgenda);
      setOpacidadeFundoAgenda(resposta.edicao.opacidadeFundoAgenda);
      setCorTextoAgenda(resposta.edicao.corTextoAgenda);
      setCorBuzioAgenda(resposta.edicao.corBuzioAgenda);
      setMostrarFaixaAgenda(resposta.edicao.mostrarFaixaAgenda);
      setCorFundoCardAgenda(resposta.edicao.corFundoCardAgenda);
      setOpacidadeFundoCardAgenda(resposta.edicao.opacidadeFundoCardAgenda);
      setCorTextoCardAgenda(resposta.edicao.corTextoCardAgenda);
      setCorTextoSecundarioCardAgenda(resposta.edicao.corTextoSecundarioCardAgenda);
      setCorAcentoCardAgenda(resposta.edicao.corAcentoCardAgenda);
      notificar("Página do evento atualizada com sucesso.");
    } catch (erro) {
      notificar(erro.message, "erro");
    }
  }

  function aoMudarCorFundo(valor) {
    setCorFundoAgenda(valor);
    salvar({ corFundoAgenda: valor });
  }

  function aoMudarOpacidade(valor) {
    setOpacidadeFundoAgenda(valor);
    salvar({ opacidadeFundoAgenda: valor });
  }

  function aoMudarCorTexto(valor) {
    setCorTextoAgenda(valor);
    salvar({ corTextoAgenda: valor });
  }

  function aoMudarCorBuzio(valor) {
    setCorBuzioAgenda(valor);
    salvar({ corBuzioAgenda: valor });
  }

  function aoMudarMostrarFaixa(valor) {
    setMostrarFaixaAgenda(valor);
    salvar({ mostrarFaixaAgenda: valor });
  }

  function aoMudarCorFundoCard(valor) {
    setCorFundoCardAgenda(valor);
    salvar({ corFundoCardAgenda: valor });
  }

  function aoMudarOpacidadeCard(valor) {
    setOpacidadeFundoCardAgenda(valor);
    salvar({ opacidadeFundoCardAgenda: valor });
  }

  function aoMudarCorTextoCard(valor) {
    setCorTextoCardAgenda(valor);
    salvar({ corTextoCardAgenda: valor });
  }

  function aoMudarCorTextoSecundarioCard(valor) {
    setCorTextoSecundarioCardAgenda(valor);
    salvar({ corTextoSecundarioCardAgenda: valor });
  }

  function aoMudarCorAcentoCard(valor) {
    setCorAcentoCardAgenda(valor);
    salvar({ corAcentoCardAgenda: valor });
  }

  return (
    <div className={styles.formulario}>
      <div className={styles.secao}>
        <CabecalhoSecao
          Icone={CalendarRange}
          titulo="Agenda/Programação"
          descricao="Aparência da seção de programação na página pública. Título, texto e atividades exibidos já vêm da agenda cadastrada — não são editáveis aqui."
        />
        <div className={styles.camposSecao}>
          <CampoCorSecao
            id="corFundoAgenda"
            rotulo="Cor de fundo da seção"
            valor={corFundoAgenda}
            onChange={aoMudarCorFundo}
          />
          <CampoOpacidade
            id="opacidadeFundoAgenda"
            rotulo="Opacidade do fundo"
            valor={opacidadeFundoAgenda}
            onChange={aoMudarOpacidade}
          />
          <CampoCorSecao
            id="corTextoAgenda"
            rotulo="Cor do texto"
            valor={corTextoAgenda}
            opcoes={OPCOES_COR_PUBLICA}
            onChange={aoMudarCorTexto}
          />
          <CampoCorSecao
            id="corBuzioAgenda"
            rotulo="Cor do búzio"
            valor={corBuzioAgenda}
            opcoes={OPCOES_COR_PUBLICA}
            onChange={aoMudarCorBuzio}
          />
          <CampoCheckbox
            id="mostrarFaixaAgenda"
            rotulo="Mostrar a faixa lateral (definida no Hero) enquanto esta seção está em tela"
            checked={mostrarFaixaAgenda}
            onChange={aoMudarMostrarFaixa}
          />
        </div>
      </div>

      <div className={styles.secao}>
        <CabecalhoSecao
          Icone={IdCard}
          titulo="Cards de atividade"
          descricao="Cores dos cards exibidos dentro desta seção — cada atividade da agenda tem um card com esse fundo, texto e cor de destaque (horário/vagas e link)."
        />
        <div className={styles.camposSecao}>
          <CampoCorSecao
            id="corFundoCardAgenda"
            rotulo="Cor de fundo dos cards"
            valor={corFundoCardAgenda}
            onChange={aoMudarCorFundoCard}
          />
          <CampoOpacidade
            id="opacidadeFundoCardAgenda"
            rotulo="Opacidade do fundo dos cards"
            valor={opacidadeFundoCardAgenda}
            onChange={aoMudarOpacidadeCard}
          />
          <CampoCorSecao
            id="corTextoCardAgenda"
            rotulo="Cor do texto (nome e período)"
            valor={corTextoCardAgenda}
            opcoes={OPCOES_COR_PUBLICA}
            onChange={aoMudarCorTextoCard}
          />
          <CampoCorSecao
            id="corTextoSecundarioCardAgenda"
            rotulo="Cor do texto secundário (tipo)"
            valor={corTextoSecundarioCardAgenda}
            opcoes={OPCOES_COR_PUBLICA}
            onChange={aoMudarCorTextoSecundarioCard}
          />
          <CampoCorSecao
            id="corAcentoCardAgenda"
            rotulo="Cor de destaque (local/vagas e link)"
            valor={corAcentoCardAgenda}
            opcoes={OPCOES_COR_PUBLICA}
            onChange={aoMudarCorAcentoCard}
          />
        </div>
      </div>
    </div>
  );
}
