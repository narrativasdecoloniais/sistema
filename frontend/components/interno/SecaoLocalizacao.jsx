import { MapPin, Trash2 } from "lucide-react";
import { Button } from "primereact/button";
import CampoTexto from "./CampoTexto";
import CampoNumero from "./CampoNumero";
import CampoSelecao from "./CampoSelecao";
import CabecalhoSecao from "./CabecalhoSecao";
import styles from "./EdicaoForm.module.scss";

const OPCOES_TIPO = [
  { valor: "LOCAL_EVENTO", rotulo: "Local do evento" },
  { valor: "HOSPEDAGEM", rotulo: "Hospedagem" },
  { valor: "RESTAURANTE", rotulo: "Restaurante" },
  { valor: "OUTRO", rotulo: "Outro" },
];

export default function SecaoLocalizacao({
  pontos,
  erros,
  aoMudarPonto,
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
        <div className={styles.listaCartoes}>
          {pontos.map((ponto, indice) => (
            <div key={ponto.id || indice} className={styles.cartaoRealizador}>
              <CampoSelecao
                id={`ponto-tipo-${indice}`}
                rotulo="Tipo"
                value={ponto.tipo}
                onChange={(evento) => {
                  aoMudarPonto(indice, "tipo", evento.target.value);
                  aoSalvar();
                }}
                erro={erros[`pontosInteresse.${indice}.tipo`]}
              >
                {OPCOES_TIPO.map((opcao) => (
                  <option key={opcao.valor} value={opcao.valor}>
                    {opcao.rotulo}
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
        <Button
          type="button"
          label="Adicionar ponto de interesse"
          onClick={aoAdicionarPonto}
          pt={{ root: { className: styles.botaoSecundario } }}
        />
      </div>
    </div>
  );
}
