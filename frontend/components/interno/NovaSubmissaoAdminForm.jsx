"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Campo from "@/components/forms/Campo";
import CampoSelect from "@/components/forms/CampoSelect";
import CampoRichText from "@/components/forms/CampoRichText";
import Botao from "@/components/forms/Botao";
import BuscaUsuario from "./BuscaUsuario";
import ModalAdicionarAutorParticipante from "./ModalAdicionarAutorParticipante";
import { useToast } from "./ToastProvider";
import { apiClient } from "@/lib/apiClient";
import { prazoSubmissaoAberto } from "@/lib/publico";
import { submissaoAdminSchema, extrairErros } from "@/lib/validacao";
import styles from "./FormularioSubmissaoParticipante.module.scss";
import estilosAutor from "./NovaSubmissaoAdminForm.module.scss";

// Inserção manual pela organização: mesmo formulário do participante, mas o
// autor principal é uma conta existente ou, sem conta, nome + e-mail (o
// backend cria a conta e manda o convite) e o prazo da modalidade não é
// exigido.
export default function NovaSubmissaoAdminForm({ edicaoId, modalidades }) {
  const router = useRouter();
  const { notificar } = useToast();
  const destinoRecebimento = `/admin/edicoes/${edicaoId}/submissoes/recebimento`;

  const [modoAutor, setModoAutor] = useState("conta");
  const [autorPrincipal, setAutorPrincipal] = useState(null);
  const [nomeAutor, setNomeAutor] = useState("");
  const [emailAutor, setEmailAutor] = useState("");
  const [modalidadeId, setModalidadeId] = useState("");
  const [areaId, setAreaId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [resumo, setResumo] = useState("");
  const [referenciaBibliografica, setReferenciaBibliografica] = useState("");
  const [coautores, setCoautores] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [erros, setErros] = useState({});
  const [carregando, setCarregando] = useState(false);

  const modalidadeSelecionada = useMemo(
    () => modalidades.find((item) => item.id === modalidadeId) || null,
    [modalidades, modalidadeId]
  );
  const areasModalidade = modalidadeSelecionada?.areas || [];

  function aoTrocarModalidade(novoId) {
    setModalidadeId(novoId);
    const modalidade = modalidades.find((item) => item.id === novoId);
    if (!modalidade?.areas?.some((area) => area.id === areaId)) {
      setAreaId("");
    }
  }

  function aoAdicionarAutor(autor) {
    const email = autor.email.toLowerCase();
    const emailPrincipal = modoAutor === "conta" ? autorPrincipal?.email : emailAutor.trim();
    const repetido =
      emailPrincipal?.toLowerCase() === email ||
      coautores.some((coautor) => coautor.email.toLowerCase() === email);
    if (repetido) {
      notificar("Esse e-mail já está entre os autores.", "erro");
      return;
    }
    setCoautores((atual) => [...atual, autor]);
    setModalAberto(false);
  }

  function aoRemoverAutor(indice) {
    setCoautores((atual) => atual.filter((_, i) => i !== indice));
  }

  async function aoSubmeter(evento) {
    evento.preventDefault();

    if (modoAutor === "conta" && !autorPrincipal) {
      setErros({ usuarioId: "Selecione o autor principal" });
      return;
    }

    const resultadoValidacao = submissaoAdminSchema.safeParse({
      ...(modoAutor === "conta" ? { usuarioId: autorPrincipal.id } : { nome: nomeAutor, email: emailAutor }),
      modalidadeSubmissaoId: modalidadeId,
      areaSubmissaoId: areaId || undefined,
      titulo,
      resumo,
      referenciaBibliografica,
    });
    if (!resultadoValidacao.success) {
      setErros(extrairErros(resultadoValidacao));
      return;
    }

    if (areasModalidade.length > 0 && !areaId) {
      setErros({ areaSubmissaoId: "Selecione a área temática desta modalidade" });
      return;
    }

    setErros({});
    setCarregando(true);

    try {
      const resposta = await apiClient.post(`/edicoes/${edicaoId}/submissoes`, {
        ...resultadoValidacao.data,
        coautores: coautores.map(({ nome, email, orcid }) => ({
          nome,
          email,
          orcid: orcid || undefined,
        })),
      });
      if (resposta?.conviteEnviado === false) {
        notificar(
          "Submissão inserida, mas o convite por e-mail falhou. A pessoa pode vincular o CPF à conta em \"Regularizar cadastro\".",
          "erro"
        );
      } else if (resposta?.conviteEnviado) {
        notificar("Submissão inserida. Enviamos um convite para o autor definir a senha.");
      } else {
        notificar("Submissão inserida com sucesso.");
      }
      router.push(destinoRecebimento);
      router.refresh();
    } catch (erro) {
      notificar(erro.message, "erro");
      setCarregando(false);
    }
  }

  return (
    <form onSubmit={aoSubmeter} className={styles.formulario}>
      <div className={estilosAutor.blocoAutorPrincipal}>
        <span className={styles.rotuloAutores}>Autor principal</span>
        <div className={estilosAutor.alternador} role="radiogroup" aria-label="Autor principal">
          {[
            ["conta", "Conta existente"],
            ["convite", "Sem conta"],
          ].map(([valor, rotulo]) => (
            <button
              key={valor}
              type="button"
              role="radio"
              aria-checked={modoAutor === valor}
              className={`${estilosAutor.opcaoAlternador} ${modoAutor === valor ? estilosAutor.opcaoAtiva : ""}`}
              onClick={() => {
                setModoAutor(valor);
                setErros({});
              }}
            >
              {rotulo}
            </button>
          ))}
        </div>

        {modoAutor === "conta" ? (
          <BuscaUsuario
            id="autorPrincipal"
            rotulo="Buscar conta"
            usuarioSelecionado={autorPrincipal}
            onSelecionar={setAutorPrincipal}
            erro={erros.usuarioId}
          />
        ) : (
          <>
            <Campo
              id="nomeAutorPrincipal"
              rotulo="Nome completo"
              value={nomeAutor}
              onChange={(evento) => setNomeAutor(evento.target.value)}
              erro={erros.nome}
            />
            <Campo
              id="emailAutorPrincipal"
              rotulo="E-mail"
              type="email"
              value={emailAutor}
              onChange={(evento) => setEmailAutor(evento.target.value)}
              erro={erros.email}
            />
            <p className={estilosAutor.textoApoio}>
              Se o e-mail já tiver conta, ela é usada. Se não, criamos uma conta sem CPF e enviamos um convite para a
              pessoa definir a senha e completar o cadastro.
            </p>
          </>
        )}
      </div>

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
            {prazoSubmissaoAberto(modalidade.prazoInicio, modalidade.prazoFim) ? "" : " (fora do prazo)"}
          </option>
        ))}
      </CampoSelect>

      {areasModalidade.length > 0 && (
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
          {areasModalidade.map((area) => (
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
        contarCaracteres
        permitirTabela
      />

      <CampoRichText
        id="referenciaBibliografica"
        rotulo="Referência bibliográfica (opcional)"
        value={referenciaBibliografica}
        onChange={setReferenciaBibliografica}
        erro={erros.referenciaBibliografica}
        ferramentas={["negrito", "italico", "link"]}
      />

      <div className={styles.blocoAutores}>
        <span className={styles.rotuloAutores}>Coautores</span>
        {coautores.length > 0 && (
          <ul className={styles.listaAutores}>
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
        )}
        <div className={styles.botaoAdicionarAutor}>
          <Botao type="button" variante="secundario" onClick={() => setModalAberto(true)}>
            + Adicionar coautor
          </Botao>
        </div>
      </div>

      <div className={styles.acoes}>
        <Botao type="submit" carregando={carregando}>
          Inserir submissão
        </Botao>
        <Botao
          type="button"
          variante="secundario"
          disabled={carregando}
          onClick={() => router.push(destinoRecebimento)}
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
