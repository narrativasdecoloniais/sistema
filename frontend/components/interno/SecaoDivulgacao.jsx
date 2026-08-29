import { Megaphone, Trash2 } from "lucide-react";
import { Button } from "primereact/button";
import CampoTexto from "./CampoTexto";
import CampoArea from "./CampoArea";
import CabecalhoSecao from "./CabecalhoSecao";
import styles from "./EdicaoForm.module.scss";

export default function SecaoDivulgacao({
  edicao,
  erros,
  aoMudar,
  aoSalvar,
  aoMudarLink,
  aoAdicionarLink,
  aoRemoverLink,
}) {
  const links = edicao.linksExtras || [];

  return (
    <div className={styles.secao}>
      <CabecalhoSecao
        Icone={Megaphone}
        titulo="Divulgação"
        descricao="Forneça mais informações para divulgar o evento nas redes sociais."
      />
      <div className={styles.camposSecao}>
        <CampoTexto
          id="instagram"
          rotulo="Instagram do evento"
          value={edicao.instagram}
          onChange={(evento) => aoMudar("instagram", evento.target.value)}
          onBlur={aoSalvar}
          erro={erros.instagram}
        />
        <CampoTexto
          id="facebook"
          rotulo="Facebook do evento"
          value={edicao.facebook}
          onChange={(evento) => aoMudar("facebook", evento.target.value)}
          onBlur={aoSalvar}
          erro={erros.facebook}
        />
        <CampoTexto
          id="emailContato"
          rotulo="E-mail de contato"
          value={edicao.emailContato}
          onChange={(evento) => aoMudar("emailContato", evento.target.value)}
          onBlur={aoSalvar}
          erro={erros.emailContato}
        />
        <CampoArea
          id="descricao"
          rotulo="Descrição"
          linhas={6}
          value={edicao.descricao}
          onChange={(evento) => aoMudar("descricao", evento.target.value)}
          onBlur={aoSalvar}
          erro={erros.descricao}
        />

        <div className={styles.listaLinks}>
          <span className={styles.rotuloLista}>Outros links</span>
          {links.map((link, indice) => (
            <div key={indice} className={styles.linhaLink}>
              <CampoTexto
                id={`link-rotulo-${indice}`}
                rotulo="Rótulo"
                value={link.rotulo}
                onChange={(evento) => aoMudarLink(indice, "rotulo", evento.target.value)}
                onBlur={aoSalvar}
                erro={erros[`linksExtras.${indice}.rotulo`]}
              />
              <CampoTexto
                id={`link-url-${indice}`}
                rotulo="URL"
                value={link.url}
                onChange={(evento) => aoMudarLink(indice, "url", evento.target.value)}
                onBlur={aoSalvar}
                erro={erros[`linksExtras.${indice}.url`]}
              />
              <button
                type="button"
                className={styles.botaoRemoverLink}
                onClick={() => aoRemoverLink(indice)}
                aria-label="Remover link"
              >
                <Trash2 size={16} strokeWidth={1.5} aria-hidden="true" />
              </button>
            </div>
          ))}
          <Button
            type="button"
            label="Adicionar link"
            onClick={aoAdicionarLink}
            pt={{ root: { className: styles.botaoSecundario } }}
          />
        </div>
      </div>
    </div>
  );
}
