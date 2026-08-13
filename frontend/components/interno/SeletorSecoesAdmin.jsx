"use client";

import CampoCheckbox from "./CampoCheckbox";
import { GRUPOS_SECOES_ADMIN } from "@/lib/secoesAdmin";
import styles from "./SeletorSecoesAdmin.module.scss";

export default function SeletorSecoesAdmin({
  acessoCompleto,
  secoesSelecionadas,
  onAlterarAcessoCompleto,
  onAlterarSecoes,
}) {
  function alternarSecao(valor, marcado) {
    if (marcado) {
      onAlterarSecoes([...secoesSelecionadas, valor]);
    } else {
      onAlterarSecoes(secoesSelecionadas.filter((secao) => secao !== valor));
    }
  }

  return (
    <div className={styles.seletor}>
      <CampoCheckbox
        id="acesso-completo"
        rotulo="Acesso completo (seções atuais e futuras)"
        checked={acessoCompleto}
        onChange={onAlterarAcessoCompleto}
      />

      <div className={`${styles.grupos} ${acessoCompleto ? styles.desabilitado : ""}`}>
        {GRUPOS_SECOES_ADMIN.map((grupo) => (
          <div key={grupo.titulo} className={styles.grupo}>
            <div className={styles.tituloGrupo}>{grupo.titulo}</div>
            <div className={styles.itens}>
              {grupo.itens.map((item) =>
                item.subitens ? (
                  <div key={item.rotulo} className={styles.subgrupo}>
                    <div className={styles.tituloSubgrupo}>{item.rotulo}</div>
                    {item.subitens.map((sub) => (
                      <CampoCheckbox
                        key={sub.valor}
                        id={`secao-${sub.valor}`}
                        rotulo={sub.rotulo}
                        checked={acessoCompleto || secoesSelecionadas.includes(sub.valor)}
                        disabled={acessoCompleto}
                        onChange={(marcado) => alternarSecao(sub.valor, marcado)}
                      />
                    ))}
                  </div>
                ) : (
                  <CampoCheckbox
                    key={item.valor}
                    id={`secao-${item.valor}`}
                    rotulo={item.rotulo}
                    checked={acessoCompleto || secoesSelecionadas.includes(item.valor)}
                    disabled={acessoCompleto}
                    onChange={(marcado) => alternarSecao(item.valor, marcado)}
                  />
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
