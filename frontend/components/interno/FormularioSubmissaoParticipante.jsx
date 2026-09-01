"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Campo from "@/components/forms/Campo";
import CampoSelect from "@/components/forms/CampoSelect";
import CampoRichText from "@/components/forms/CampoRichText";
import Checkbox from "@/components/forms/Checkbox";
import Botao from "@/components/forms/Botao";
import ModalAdicionarAutorParticipante from "./ModalAdicionarAutorParticipante";
import { useToast } from "./ToastProvider";
import { listarModalidadesSubmissaoPublicas } from "@/lib/publico";
import { criarSubmissao } from "@/lib/participanteSubmissoes";
import { submissaoSchema, extrairErros } from "@/lib/validacao";
import styles from "./FormularioSubmissaoParticipante.module.scss";

export default function FormularioSubmissaoParticipante({ nomeUsuario }) {
  const router = useRouter();
  const { notificar } = useToast();

  const [modalidades, setModalidades] = useState([]);
  const [modalidadeId, setModalidadeId] = useState("");
  const [areaId, setAreaId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [resumo, setResumo] = useState("");
  const [referenciaBibliografica, setReferenciaBibliografica] = useState("");
  const [coautores, setCoautores] = useState([]);
  const [aceiteDeclaracao, setAceiteDeclaracao] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [erros, setErros] = useState({});
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    let cancelado = false;
    listarModalidadesSubmissaoPublicas().then((dados) => {
      if (!cancelado) setModalidades(dados);
    });
    return () => {
      cancelado = true;
    };
  }, []);

  const modalidadeSelecionada = useMemo(
    () => modalidades.find((item) => item.id === modalidadeId) || null,
    [modalidades, modalidadeId]
  );

  function aoTrocarModalidade(novoId) {
    setModalidadeId(novoId);
    const modalidade = modalidades.find((item) => item.id === novoId);
    if (!modalidade?.areas.some((area) => area.id === areaId)) {
      setAreaId("");
    }
  }

  function aoAdicionarAutor(autor) {
    setCoautores((atual) => [...atual, autor]);
    setModalAberto(false);
  }

  function aoRemoverAutor(indice) {
    setCoautores((atual) => atual.filter((_, i) => i !== indice));
  }

  async function aoSubmeter(evento) {
    evento.preventDefault();

    const resultadoValidacao = submissaoSchema.safeParse({
      modalidadeSubmissaoId: modalidadeId,
      areaSubmissaoId: areaId || undefined,
      titulo,
      resumo,
      referenciaBibliografica,
      aceiteDeclaracao,
    });
    if (!resultadoValidacao.success) {
      setErros(extrairErros(resultadoValidacao));
      return;
    }

    const areaObrigatoria = modalidadeSelecionada?.areas.length > 0;
    if (areaObrigatoria && !areaId) {
      setErros({ areaSubmissaoId: "Selecione a área temática desta modalidade" });
      return;
    }

    setErros({});
    setCarregando(true);

    try {
      await criarSubmissao({
        modalidadeSubmissaoId: modalidadeId,
        areaSubmissaoId: areaId || undefined,
        titulo,
        resumo,
        referenciaBibliografica,
        coautores: coautores.map(({ nome, email, orcid }) => ({
          nome,
          email,
          orcid: orcid || undefined,
        })),
        aceiteDeclaracao,
      });
      notificar("Trabalho enviado com sucesso!");
      router.push("/participante/submissoes");
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <form onSubmit={aoSubmeter} className={styles.formulario}>
      <CampoSelect
        id="modalidade"
        rotulo="Modalidade"
        value={modalidadeId}
        onChange={(evento) => aoTrocarModalidade(evento.target.value)}
        erro={erros.modalidadeSubmissaoId}
      >
        <option value="" disabled>
          Selecione
        </option>
        {modalidades.map((modalidade) => (
          <option key={modalidade.id} value={modalidade.id}>
            {modalidade.nome}
          </option>
        ))}
      </CampoSelect>

      {modalidadeSelecionada && modalidadeSelecionada.areas.length > 0 && (
        <CampoSelect
          id="area"
          rotulo={modalidadeSelecionada.rotuloItem || "Área"}
          value={areaId}
          onChange={(evento) => setAreaId(evento.target.value)}
          erro={erros.areaSubmissaoId}
        >
          <option value="" disabled>
            Selecione
          </option>
          {modalidadeSelecionada.areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.titulo}
            </option>
          ))}
        </CampoSelect>
      )}

      <Campo
        id="titulo"
        rotulo="Título"
        value={titulo}
        onChange={(evento) => setTitulo(evento.target.value)}
        erro={erros.titulo}
      />

      <CampoRichText
        id="resumo"
        rotulo="Resumo"
        value={resumo}
        onChange={setResumo}
        erro={erros.resumo}
        permitirImagem
      />

      <CampoRichText
        id="referenciaBibliografica"
        rotulo="Referência bibliográfica"
        value={referenciaBibliografica}
        onChange={setReferenciaBibliografica}
        erro={erros.referenciaBibliografica}
        ferramentas={["negrito"]}
      />

      <div className={styles.blocoAutores}>
        <span className={styles.rotuloAutores}>Autores</span>
        <ul className={styles.listaAutores}>
          <li className={styles.linhaAutor}>
            <span className={styles.autorInfo}>
              <span className={styles.autorNome}>{nomeUsuario}</span>
            </span>
            <span className={styles.marcadorVoce}>Você</span>
          </li>
          {coautores.map((autor, indice) => (
            <li key={`${autor.email}-${indice}`} className={styles.linhaAutor}>
              <span className={styles.autorInfo}>
                <span className={styles.autorNome}>{autor.nome}</span>
                <span className={styles.autorEmail}>{autor.email}</span>
              </span>
              <button type="button" className={styles.botaoRemover} onClick={() => aoRemoverAutor(indice)}>
                Remover
              </button>
            </li>
          ))}
        </ul>
        <div className={styles.botaoAdicionarAutor}>
          <Botao type="button" variante="secundario" onClick={() => setModalAberto(true)}>
            + Adicionar autor
          </Botao>
        </div>
      </div>

      <Checkbox
        id="aceiteDeclaracao"
        rotulo="Declaro que li e estou de acordo com as regras para submissão"
        checked={aceiteDeclaracao}
        onChange={(evento) => setAceiteDeclaracao(evento.target.checked)}
        erro={erros.aceiteDeclaracao}
      />

      <div className={styles.acoes}>
        <Botao type="submit" carregando={carregando}>
          Submeter
        </Botao>
        <Botao
          type="button"
          variante="secundario"
          disabled={carregando}
          onClick={() => router.push("/participante/submissoes")}
        >
          Cancelar
        </Botao>
      </div>

      {modalAberto && (
        <ModalAdicionarAutorParticipante aoAdicionar={aoAdicionarAutor} aoFechar={() => setModalAberto(false)} />
      )}
    </form>
  );
}
