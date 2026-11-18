"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import Botao from "@/components/forms/Botao";
import CabecalhoSecao from "./CabecalhoSecao";
import CampoCheckbox from "./CampoCheckbox";
import { useToast } from "./ToastProvider";
import { GRUPOS_SECOES_MONITOR } from "@/lib/secoesAdmin";
import { salvarAcessoMonitores } from "@/lib/monitoria";
import styles from "./EdicaoForm.module.scss";
import estilos from "./MonitoriaPainel.module.scss";
import seletor from "./SeletorSecoesAdmin.module.scss";

// ADMIN escolhe quais seções do painel os monitores com situação "Selecionado"
// desta edição acessam. Vale só para esta edição e acompanha a situação: quem
// deixa de ser selecionado perde o acesso sozinho.
export default function AcessoMonitoresForm({ edicaoId, secoesIniciais, aoSalvar }) {
  const { notificar } = useToast();
  const [secoes, setSecoes] = useState(secoesIniciais || []);
  const [salvando, setSalvando] = useState(false);

  function alternar(valor, marcado) {
    setSecoes((atual) => (marcado ? [...atual, valor] : atual.filter((secao) => secao !== valor)));
  }

  async function salvar(evento) {
    evento.preventDefault();
    setSalvando(true);
    try {
      await salvarAcessoMonitores(edicaoId, secoes);
      notificar("Acesso dos monitores atualizado.");
      await aoSalvar?.();
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setSalvando(false);
    }
  }

  function caixa(item) {
    return (
      <CampoCheckbox
        key={item.valor}
        id={`monitor-secao-${item.valor}`}
        rotulo={item.rotulo}
        checked={secoes.includes(item.valor)}
        onChange={(marcado) => alternar(item.valor, marcado)}
      />
    );
  }

  return (
    <form className={styles.secao} onSubmit={salvar} noValidate>
      <CabecalhoSecao
        Icone={ShieldCheck}
        titulo="Acesso dos monitores ao painel"
        descricao="Seções do painel que os monitores selecionados desta edição podem usar. O acesso vale só para esta edição e acompanha a situação: quem deixa de ser selecionado perde o acesso. Usuários, Monitoria (dados pessoais dos candidatos) e os catálogos globais de tipos não podem ser liberados."
      />
      <div className={estilos.camposSecao}>
        <div className={seletor.grupos}>
          {GRUPOS_SECOES_MONITOR.map((grupo) => (
            <div key={grupo.titulo} className={seletor.grupo}>
              <div className={seletor.tituloGrupo}>{grupo.titulo}</div>
              <div className={seletor.itens}>
                {grupo.itens.map((item) =>
                  item.subitens ? (
                    <div key={item.rotulo} className={seletor.subgrupo}>
                      <div className={seletor.tituloSubgrupo}>{item.rotulo}</div>
                      {item.subitens.map(caixa)}
                    </div>
                  ) : (
                    caixa(item)
                  )
                )}
              </div>
            </div>
          ))}
        </div>
        <div className={estilos.rodapeFormulario}>
          <Botao type="submit" carregando={salvando}>
            Salvar acesso dos monitores
          </Botao>
        </div>
      </div>
    </form>
  );
}
