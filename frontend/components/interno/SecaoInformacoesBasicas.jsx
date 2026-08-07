import { FileText } from "lucide-react";
import CampoTexto from "./CampoTexto";
import CampoNumero from "./CampoNumero";
import CabecalhoSecao from "./CabecalhoSecao";
import styles from "./EdicaoForm.module.scss";

export default function SecaoInformacoesBasicas({ edicao, erros, aoMudar, aoSalvar, resumido }) {
  if (resumido) {
    return (
      <>
        <CampoNumero
          id="numero"
          rotulo="Número da edição"
          value={edicao.numero}
          onValueChange={(evento) => aoMudar("numero", evento.value)}
          onBlur={aoSalvar}
          erro={erros.numero}
        />
        <CampoTexto
          id="nome"
          rotulo="Nome / tema da edição"
          value={edicao.nome}
          onChange={(evento) => aoMudar("nome", evento.target.value)}
          onBlur={aoSalvar}
          erro={erros.nome}
        />
      </>
    );
  }

  return (
    <div className={styles.secao}>
      <CabecalhoSecao
        Icone={FileText}
        titulo="Informações básicas"
        descricao="Dê um nome ao evento e configure o link de acesso e a carga horária total."
      />
      <div className={styles.camposSecao}>
        <div className={styles.linha}>
          <CampoNumero
            id="numero"
            rotulo="Número da edição"
            value={edicao.numero}
            onValueChange={(evento) => aoMudar("numero", evento.value)}
            onBlur={aoSalvar}
            erro={erros.numero}
          />
          <CampoNumero
            id="cargaHorariaTotal"
            rotulo="Carga horária total (horas)"
            value={edicao.cargaHorariaTotal}
            onValueChange={(evento) => aoMudar("cargaHorariaTotal", evento.value)}
            onBlur={aoSalvar}
            erro={erros.cargaHorariaTotal}
          />
        </div>
        <CampoTexto
          id="nome"
          rotulo="Título do evento"
          value={edicao.nome}
          onChange={(evento) => aoMudar("nome", evento.target.value)}
          onBlur={aoSalvar}
          erro={erros.nome}
        />
        <CampoTexto
          id="slug"
          rotulo="Link de acesso"
          value={edicao.slug}
          onChange={(evento) => aoMudar("slug", evento.target.value)}
          onBlur={aoSalvar}
          erro={erros.slug}
        />
      </div>
    </div>
  );
}
