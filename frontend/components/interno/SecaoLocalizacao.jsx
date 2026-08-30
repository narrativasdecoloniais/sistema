import { MapPin, Trash2 } from "lucide-react";
import { Button } from "primereact/button";
import CampoTexto from "./CampoTexto";
import CampoNumero from "./CampoNumero";
import CampoSelecao from "./CampoSelecao";
import CampoLogo from "./CampoLogo";
import CampoCorSecao, { OPCOES_COR_PUBLICA } from "./CampoCorSecao";
import CampoOpacidade from "./CampoOpacidade";
import CampoCheckbox from "./CampoCheckbox";
import CabecalhoSecao from "./CabecalhoSecao";
import styles from "./EdicaoForm.module.scss";

export default function SecaoLocalizacao({
  pontos,
  tipos,
  corFundo,
  opacidade,
  corTexto,
  mostrarFaixa,
  erros,
  aoMudarPonto,
  aoMudarCorFundo,
  aoMudarOpacidade,
  aoMudarCorTexto,
  aoMudarMostrarFaixa,
  aoSalvar,
  aoAdicionarPonto,
  aoPedirRemocao,
}) {
  return (
    <div className={styles.secao}>
      <CabecalhoSecao
        Icone={MapPin}
        titulo="Localização"
        descricao="Pontos exibidos num mapa na página pública do evento: local do evento, opções de hospedagem, restaurantes etc. Pra pegar as coordenadas, clique com o botão direito no local desejado no Google Maps e copie a latitude/longitude mostradas."
      />
      <div className={styles.camposSecao}>
        <CampoCorSecao
          id="corFundoLocalizacao"
          rotulo="Cor de fundo da seção"
          valor={corFundo}
          onChange={aoMudarCorFundo}
        />
        <CampoOpacidade
          id="opacidadeFundoLocalizacao"
          rotulo="Opacidade do fundo"
          valor={opacidade}
          onChange={aoMudarOpacidade}
        />
        <CampoCorSecao
          id="corTextoLocalizacao"
          rotulo="Cor do texto"
          valor={corTexto}
          opcoes={OPCOES_COR_PUBLICA}
          onChange={aoMudarCorTexto}
        />
        <CampoCheckbox
          id="mostrarFaixaLocalizacao"
          rotulo="Mostrar a faixa lateral (definida no Hero) enquanto esta seção está em tela"
          checked={mostrarFaixa}
          onChange={aoMudarMostrarFaixa}
        />
        <div className={styles.listaCartoes}>
          {pontos.map((ponto, indice) => (
            <div key={ponto.id || indice} className={styles.cartaoRealizador}>
              <CampoSelecao
                id={`ponto-tipo-${indice}`}
                rotulo="Tipo"
                value={ponto.tipoId}
                onChange={(evento) => {
                  aoMudarPonto(indice, "tipoId", evento.target.value);
                  aoSalvar();
                }}
                erro={erros[`pontosInteresse.${indice}.tipoId`]}
              >
                {tipos.map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nome}
                  </option>
                ))}
              </CampoSelecao>
              <CampoTexto
                id={`ponto-nome-${indice}`}
                rotulo="Nome"
                value={ponto.nome}
                onChange={(evento) => aoMudarPonto(indice, "nome", evento.target.value)}
                onBlur={aoSalvar}
                erro={erros[`pontosInteresse.${indice}.nome`]}
              />
              <CampoLogo
                id={`ponto-imagem-${indice}`}
                rotulo="Foto (opcional)"
                valor={ponto.imagem}
                onChange={(imagem) => aoMudarPonto(indice, "imagem", imagem)}
                erro={erros[`pontosInteresse.${indice}.imagem`]}
                textoItem="foto"
              />
              <CampoTexto
                id={`ponto-endereco-${indice}`}
                rotulo="Endereço (opcional)"
                value={ponto.endereco || ""}
                onChange={(evento) => aoMudarPonto(indice, "endereco", evento.target.value)}
                onBlur={aoSalvar}
                erro={erros[`pontosInteresse.${indice}.endereco`]}
              />
              <CampoNumero
                id={`ponto-latitude-${indice}`}
                rotulo="Latitude"
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={8}
                min={-90}
                max={90}
                value={ponto.latitude}
                onValueChange={(evento) => aoMudarPonto(indice, "latitude", evento.value)}
                onBlur={aoSalvar}
                erro={erros[`pontosInteresse.${indice}.latitude`]}
              />
              <CampoNumero
                id={`ponto-longitude-${indice}`}
                rotulo="Longitude"
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={8}
                min={-180}
                max={180}
                value={ponto.longitude}
                onValueChange={(evento) => aoMudarPonto(indice, "longitude", evento.value)}
                onBlur={aoSalvar}
                erro={erros[`pontosInteresse.${indice}.longitude`]}
              />
              <CampoTexto
                id={`ponto-link-${indice}`}
                rotulo="Link (opcional)"
                value={ponto.link || ""}
                onChange={(evento) => aoMudarPonto(indice, "link", evento.target.value)}
                onBlur={aoSalvar}
                erro={erros[`pontosInteresse.${indice}.link`]}
              />
              <button
                type="button"
                className={styles.botaoRemoverRealizador}
                onClick={() => aoPedirRemocao(indice)}
                aria-label="Remover ponto de interesse"
              >
                <Trash2 size={16} strokeWidth={1.5} aria-hidden="true" />
                Remover ponto
              </button>
            </div>
          ))}
        </div>
        {tipos.length === 0 ? (
          <p className={styles.avisoContraste}>
            Cadastre um tipo em Configurações → Tipos de ponto de referência antes de adicionar um
            ponto.
          </p>
        ) : (
          <Button
            type="button"
            label="Adicionar ponto de interesse"
            onClick={aoAdicionarPonto}
            pt={{ root: { className: styles.botaoSecundario } }}
          />
        )}
      </div>
    </div>
  );
}
