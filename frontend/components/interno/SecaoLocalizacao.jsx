import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, MapPin, Plus, Trash2 } from "lucide-react";
import { Button } from "primereact/button";
import CampoTexto from "./CampoTexto";
import CampoArea from "./CampoArea";
import CampoNumero from "./CampoNumero";
import CampoSelecao from "./CampoSelecao";
import CampoSugestoes from "./CampoSugestoes";
import CampoLogo from "./CampoLogo";
import CampoCorSecao, { OPCOES_COR_PUBLICA } from "./CampoCorSecao";
import CampoOpacidade from "./CampoOpacidade";
import CampoCheckbox from "./CampoCheckbox";
import CabecalhoSecao from "./CabecalhoSecao";
import { compararTiposPonto } from "@/lib/localizacao";
import styles from "./EdicaoForm.module.scss";
import stylesLocalizacao from "./SecaoLocalizacao.module.scss";

// Chave estável do cartão: id do ponto salvo ou a posição de um ponto novo
// (LocalizacaoForm remapeia para o id depois do primeiro salvamento).
export function chavePonto(ponto, indice) {
  return ponto.id || `novo-${indice}`;
}

function CartaoPonto({
  ponto,
  indice,
  tipos,
  sugestoesGrupo,
  expandido,
  podeSubir,
  podeDescer,
  erros,
  aoAlternar,
  aoMudarPonto,
  aoSalvar,
  aoMover,
  aoPedirRemocao,
}) {
  const erro = (campo) => erros[`pontosInteresse.${indice}.${campo}`];
  const temErro = Object.keys(erros).some((chave) => chave.startsWith(`pontosInteresse.${indice}.`));
  const idCorpo = `ponto-corpo-${indice}`;

  return (
    <li className={stylesLocalizacao.cartao} data-erro={temErro || undefined}>
      <div className={stylesLocalizacao.cartaoCabecalho}>
        <button
          type="button"
          className={stylesLocalizacao.alternar}
          onClick={aoAlternar}
          aria-expanded={expandido}
          aria-controls={idCorpo}
        >
          {expandido ? (
            <ChevronDown size={16} strokeWidth={1.5} aria-hidden="true" />
          ) : (
            <ChevronRight size={16} strokeWidth={1.5} aria-hidden="true" />
          )}
          <span className={stylesLocalizacao.resumo}>
            <span className={stylesLocalizacao.resumoNome}>{ponto.nome?.trim() || "Novo ponto"}</span>
            {(ponto.grupo?.trim() || ponto.descricao?.trim()) && (
              <span className={stylesLocalizacao.resumoApoio}>
                {[ponto.grupo?.trim(), ponto.descricao?.trim()].filter(Boolean).join(" · ")}
              </span>
            )}
          </span>
        </button>
        <div className={stylesLocalizacao.acoesCartao}>
          <button
            type="button"
            className={stylesLocalizacao.botaoIcone}
            onClick={() => aoMover(-1)}
            disabled={!podeSubir}
            aria-label={`Mover "${ponto.nome || "ponto"}" para cima`}
          >
            <ArrowUp size={16} strokeWidth={1.5} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={stylesLocalizacao.botaoIcone}
            onClick={() => aoMover(1)}
            disabled={!podeDescer}
            aria-label={`Mover "${ponto.nome || "ponto"}" para baixo`}
          >
            <ArrowDown size={16} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>
      </div>

      {expandido && (
        <div id={idCorpo} className={stylesLocalizacao.cartaoCorpo}>
          <div className={stylesLocalizacao.duasColunas}>
            <CampoSelecao
              id={`ponto-tipo-${indice}`}
              rotulo="Categoria"
              value={ponto.tipoId}
              onChange={(evento) => aoMudarPonto(indice, "tipoId", evento.target.value, true)}
              erro={erro("tipoId")}
            >
              {tipos.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nome}
                </option>
              ))}
            </CampoSelecao>
            <CampoSugestoes
              id={`ponto-grupo-${indice}`}
              rotulo="Subcategoria (opcional)"
              value={ponto.grupo || ""}
              sugestoes={sugestoesGrupo}
              onChange={(valor) => aoMudarPonto(indice, "grupo", valor)}
              onSelect={(evento) => aoMudarPonto(indice, "grupo", evento.value, true)}
              onBlur={aoSalvar}
              placeholder="Ex.: Asa Norte, Bares e botecos"
              erro={erro("grupo")}
            />
          </div>
          <CampoTexto
            id={`ponto-nome-${indice}`}
            rotulo="Nome"
            value={ponto.nome}
            onChange={(evento) => aoMudarPonto(indice, "nome", evento.target.value)}
            onBlur={aoSalvar}
            erro={erro("nome")}
          />
          <CampoArea
            id={`ponto-descricao-${indice}`}
            rotulo="Descrição curta (opcional)"
            linhas={2}
            maxLength={300}
            value={ponto.descricao || ""}
            onChange={(evento) => aoMudarPonto(indice, "descricao", evento.target.value)}
            onBlur={aoSalvar}
            placeholder="Ex.: No campus da UnB. Opções veganas, sem glúten e sem lactose."
            erro={erro("descricao")}
          />
          <CampoTexto
            id={`ponto-link-${indice}`}
            rotulo="Link (opcional) — site, Instagram, Booking…"
            value={ponto.link || ""}
            onChange={(evento) => aoMudarPonto(indice, "link", evento.target.value)}
            onBlur={aoSalvar}
            erro={erro("link")}
          />
          <CampoTexto
            id={`ponto-endereco-${indice}`}
            rotulo="Endereço (opcional)"
            value={ponto.endereco || ""}
            onChange={(evento) => aoMudarPonto(indice, "endereco", evento.target.value)}
            onBlur={aoSalvar}
            erro={erro("endereco")}
          />
          <div className={stylesLocalizacao.duasColunas}>
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
              erro={erro("latitude")}
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
              erro={erro("longitude")}
            />
          </div>
          <CampoCheckbox
            id={`ponto-aproximado-${indice}`}
            rotulo="Localização aproximada — o pin marca o endereço, bloco ou setor, não o local exato"
            checked={Boolean(ponto.aproximado)}
            onChange={(valor) => aoMudarPonto(indice, "aproximado", valor, true)}
          />
          <CampoLogo
            id={`ponto-imagem-${indice}`}
            rotulo="Foto (opcional)"
            valor={ponto.imagem}
            onChange={(imagem) => aoMudarPonto(indice, "imagem", imagem, true)}
            erro={erro("imagem")}
            textoItem="foto"
          />
          <button
            type="button"
            className={styles.botaoRemoverRealizador}
            onClick={() => aoPedirRemocao(indice)}
            aria-label={`Remover "${ponto.nome || "ponto"}"`}
          >
            <Trash2 size={16} strokeWidth={1.5} aria-hidden="true" />
            Remover ponto
          </button>
        </div>
      )}
    </li>
  );
}

export default function SecaoLocalizacao({
  pontos,
  tipos,
  corFundo,
  opacidade,
  corTexto,
  mostrarFaixa,
  introducao,
  textosTipos,
  expandidos,
  erros,
  aoMudarPonto,
  aoMudarCorFundo,
  aoMudarOpacidade,
  aoMudarCorTexto,
  aoMudarMostrarFaixa,
  aoMudarIntroducao,
  aoMudarTextoTipo,
  aoAlternarPonto,
  aoMoverPonto,
  aoSalvar,
  aoAdicionarPonto,
  aoPedirRemocao,
}) {
  // Categorias na ordem da página pública; cada uma lista os pontos dela
  // na ordem do array (que é a ordem salva).
  const tiposPorId = new Map(tipos.map((tipo) => [tipo.id, tipo]));
  const categorias = [...new Set(pontos.map((ponto) => ponto.tipoId))]
    .map((tipoId) => tiposPorId.get(tipoId) || { id: tipoId, nome: "Sem categoria", cor: "#7a7166" })
    .sort(compararTiposPonto)
    .map((tipo) => {
      const indices = pontos.flatMap((ponto, indice) => (ponto.tipoId === tipo.id ? [indice] : []));
      const grupos = [...new Set(indices.map((i) => pontos[i].grupo?.trim()).filter(Boolean))];
      return { tipo, indices, grupos };
    });

  return (
    <div className={styles.secao}>
      <CabecalhoSecao
        Icone={MapPin}
        titulo="Localização"
        descricao="Guia exibido na página pública com mapa e lista: local do evento, hospedagem, alimentação etc. Cada ponto pertence a uma categoria (Configurações → Tipos de ponto de referência, que também define a cor no mapa e a ordem) e pode ter uma subcategoria livre, como uma região ou um tipo de estabelecimento. Pra pegar as coordenadas, clique com o botão direito no local desejado no Google Maps e copie a latitude/longitude mostradas."
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
        <CampoArea
          id="introducaoLocalizacao"
          rotulo="Texto de abertura (opcional)"
          linhas={3}
          maxLength={600}
          value={introducao}
          onChange={(evento) => aoMudarIntroducao(evento.target.value)}
          onBlur={aoSalvar}
          placeholder="Ex.: Um guia de hospedagem e alimentação perto da UnB para os dias do evento."
          erro={erros.introducaoLocalizacao}
        />

        {categorias.map(({ tipo, indices, grupos }) => (
          <section key={tipo.id} className={stylesLocalizacao.categoria} aria-label={tipo.nome}>
            <div className={stylesLocalizacao.categoriaCabecalho}>
              <h3 className={stylesLocalizacao.categoriaTitulo}>
                <span
                  className={stylesLocalizacao.swatch}
                  style={{ backgroundColor: tipo.cor }}
                  aria-hidden="true"
                />
                {tipo.nome}
              </h3>
              <span className={stylesLocalizacao.categoriaTotal}>
                {indices.length === 1 ? "1 ponto" : `${indices.length} pontos`}
              </span>
            </div>
            <CampoArea
              id={`texto-tipo-${tipo.id}`}
              rotulo="Texto de apresentação da categoria (opcional)"
              linhas={3}
              maxLength={800}
              value={textosTipos[tipo.id] || ""}
              onChange={(evento) => aoMudarTextoTipo(tipo.id, evento.target.value)}
              onBlur={aoSalvar}
              placeholder="Ex.: Os valores e a disponibilidade variam; consulte os links para o período do evento."
              erro={erros[`textosTiposLocalizacao.${tipo.id}`]}
            />
            <ul className={stylesLocalizacao.listaPontos}>
              {indices.map((indice, posicao) => (
                <CartaoPonto
                  key={chavePonto(pontos[indice], indice)}
                  ponto={pontos[indice]}
                  indice={indice}
                  tipos={tipos}
                  sugestoesGrupo={grupos}
                  expandido={expandidos.has(chavePonto(pontos[indice], indice))}
                  podeSubir={posicao > 0}
                  podeDescer={posicao < indices.length - 1}
                  erros={erros}
                  aoAlternar={() => aoAlternarPonto(chavePonto(pontos[indice], indice))}
                  aoMudarPonto={aoMudarPonto}
                  aoSalvar={aoSalvar}
                  aoMover={(direcao) => aoMoverPonto(indice, indices[posicao + direcao])}
                  aoPedirRemocao={aoPedirRemocao}
                />
              ))}
            </ul>
            <button
              type="button"
              className={stylesLocalizacao.adicionarNaCategoria}
              onClick={() => aoAdicionarPonto(tipo.id)}
            >
              <Plus size={16} strokeWidth={1.5} aria-hidden="true" />
              Adicionar ponto em {tipo.nome}
            </button>
          </section>
        ))}

        {tipos.length === 0 ? (
          <p className={styles.avisoContraste}>
            Cadastre um tipo em Configurações → Tipos de ponto de referência antes de adicionar um
            ponto.
          </p>
        ) : (
          <Button
            type="button"
            label={categorias.length > 0 ? "Adicionar ponto em outra categoria" : "Adicionar ponto de interesse"}
            onClick={() => {
              const semPontos = tipos.find((tipo) => !categorias.some((categoria) => categoria.tipo.id === tipo.id));
              aoAdicionarPonto((semPontos || tipos[0]).id);
            }}
            pt={{ root: { className: styles.botaoSecundario } }}
          />
        )}
      </div>
    </div>
  );
}
