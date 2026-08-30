"use client";

import { useState } from "react";
import { z } from "zod";
import { Palette } from "lucide-react";
import { useToast } from "./ToastProvider";
import { apiClient } from "@/lib/apiClient";
import { extrairErros } from "@/lib/validacao";
import { corSchema } from "@/lib/cores";
import CampoCorSecao, { OPCOES_COR_PUBLICA } from "./CampoCorSecao";
import CampoOpacidade from "./CampoOpacidade";
import CampoCheckbox from "./CampoCheckbox";
import CabecalhoSecao from "./CabecalhoSecao";
import styles from "./EdicaoForm.module.scss";

const aparenciaAtividadesSchema = z.object({
  corFundoAtividades: corSchema,
  opacidadeFundoAtividades: z.number().int().min(0).max(100).optional(),
  corTextoAtividades: corSchema,
  corBuzioAtividades: corSchema,
  mostrarFaixaAtividades: z.boolean().optional(),
});

// Aparência compartilhada por TODAS as páginas de detalhe de atividade
// (.../atividades/[slug]) — não personalização por atividade individual
// (ver DetalheAtividade.jsx no público, que agora lê esses campos de
// atividade.edicao em vez de campos próprios da atividade).
export default function AparenciaAtividadesForm({ edicaoInicial }) {
  const { notificar } = useToast();
  const [corFundo, setCorFundo] = useState(edicaoInicial.corFundoAtividades || "PAPEL");
  const [opacidade, setOpacidade] = useState(edicaoInicial.opacidadeFundoAtividades ?? 100);
  const [corTexto, setCorTexto] = useState(edicaoInicial.corTextoAtividades || "TINTA");
  const [corBuzio, setCorBuzio] = useState(edicaoInicial.corBuzioAtividades || "BARRO");
  const [mostrarFaixa, setMostrarFaixa] = useState(edicaoInicial.mostrarFaixaAtividades ?? true);
  const [erros, setErros] = useState({});

  async function salvar(overrides = {}) {
    const resultado = aparenciaAtividadesSchema.safeParse({
      corFundoAtividades: overrides.corFundoAtividades ?? corFundo,
      opacidadeFundoAtividades: overrides.opacidadeFundoAtividades ?? opacidade,
      corTextoAtividades: overrides.corTextoAtividades ?? corTexto,
      corBuzioAtividades: overrides.corBuzioAtividades ?? corBuzio,
      mostrarFaixaAtividades: overrides.mostrarFaixaAtividades ?? mostrarFaixa,
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
      setCorFundo(resposta.edicao.corFundoAtividades);
      setOpacidade(resposta.edicao.opacidadeFundoAtividades);
      setCorTexto(resposta.edicao.corTextoAtividades);
      setCorBuzio(resposta.edicao.corBuzioAtividades);
      setMostrarFaixa(resposta.edicao.mostrarFaixaAtividades);
      notificar("Página do evento atualizada com sucesso.");
    } catch (erro) {
      notificar(erro.message, "erro");
    }
  }

  function aoMudarCorFundo(valor) {
    setCorFundo(valor);
    salvar({ corFundoAtividades: valor });
  }

  function aoMudarOpacidade(valor) {
    setOpacidade(valor);
    salvar({ opacidadeFundoAtividades: valor });
  }

  function aoMudarCorTexto(valor) {
    setCorTexto(valor);
    salvar({ corTextoAtividades: valor });
  }

  function aoMudarCorBuzio(valor) {
    setCorBuzio(valor);
    salvar({ corBuzioAtividades: valor });
  }

  function aoMudarMostrarFaixa(valor) {
    setMostrarFaixa(valor);
    salvar({ mostrarFaixaAtividades: valor });
  }

  return (
    <div className={styles.formulario}>
      <div className={styles.secao}>
        <CabecalhoSecao
          Icone={Palette}
          titulo="Atividades"
          descricao="Aparência aplicada à página pública de todas as atividades — não é possível personalizar cada atividade individualmente."
        />
        <div className={styles.camposSecao}>
          <CampoCorSecao
            id="corFundoAtividades"
            rotulo="Cor de fundo"
            valor={corFundo}
            onChange={aoMudarCorFundo}
          />
          <CampoOpacidade
            id="opacidadeFundoAtividades"
            rotulo="Opacidade do fundo"
            valor={opacidade}
            onChange={aoMudarOpacidade}
          />
          <CampoCorSecao
            id="corTextoAtividades"
            rotulo="Cor do texto"
            valor={corTexto}
            opcoes={OPCOES_COR_PUBLICA}
            onChange={aoMudarCorTexto}
          />
          <CampoCorSecao
            id="corBuzioAtividades"
            rotulo="Cor do búzio"
            valor={corBuzio}
            opcoes={OPCOES_COR_PUBLICA}
            onChange={aoMudarCorBuzio}
          />
          <CampoCheckbox
            id="mostrarFaixaAtividades"
            rotulo="Mostrar a faixa lateral (definida no Hero) nas páginas de atividade"
            checked={mostrarFaixa}
            onChange={aoMudarMostrarFaixa}
          />
        </div>
      </div>
    </div>
  );
}
