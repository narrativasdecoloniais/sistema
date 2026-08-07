"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Campo from "@/components/forms/Campo";
import CampoSenha from "@/components/forms/CampoSenha";
import CampoSelect from "@/components/forms/CampoSelect";
import Botao from "@/components/forms/Botao";
import Alerta from "@/components/forms/Alerta";
import { apiClient } from "@/lib/apiClient";
import { atualizarPerfilSchema, alterarSenhaSchema, extrairErros, categorias } from "@/lib/validacao";
import styles from "./page.module.scss";

export default function PerfilForm({ usuarioInicial }) {
  const router = useRouter();
  const usuario = usuarioInicial;

  const [perfil, setPerfil] = useState({
    nome: usuario?.nome || "",
    instituicao: usuario?.instituicao || "",
    categoria: usuario?.categoria || "",
  });
  const [errosPerfil, setErrosPerfil] = useState({});
  const [mensagemPerfil, setMensagemPerfil] = useState("");
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);

  const [senhas, setSenhas] = useState({ senhaAtual: "", novaSenha: "", confirmarNovaSenha: "" });
  const [errosSenha, setErrosSenha] = useState({});
  const [mensagemSenha, setMensagemSenha] = useState("");
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [erroExclusao, setErroExclusao] = useState("");
  const [excluindo, setExcluindo] = useState(false);

  async function salvarPerfil(evento) {
    evento.preventDefault();
    setMensagemPerfil("");

    const resultado = atualizarPerfilSchema.safeParse(perfil);
    if (!resultado.success) {
      setErrosPerfil(extrairErros(resultado));
      return;
    }
    setErrosPerfil({});
    setSalvandoPerfil(true);

    try {
      await apiClient.patch("/usuarios/me", resultado.data);
      setMensagemPerfil("Perfil atualizado com sucesso.");
      router.refresh();
    } catch (erro) {
      setMensagemPerfil(erro.message);
    } finally {
      setSalvandoPerfil(false);
    }
  }

  async function salvarSenha(evento) {
    evento.preventDefault();
    setMensagemSenha("");

    const resultado = alterarSenhaSchema.safeParse(senhas);
    if (!resultado.success) {
      setErrosSenha(extrairErros(resultado));
      return;
    }
    setErrosSenha({});
    setSalvandoSenha(true);

    try {
      await apiClient.patch("/usuarios/me/senha", resultado.data);
      setMensagemSenha("Senha alterada com sucesso.");
      setSenhas({ senhaAtual: "", novaSenha: "", confirmarNovaSenha: "" });
    } catch (erro) {
      setMensagemSenha(erro.message);
    } finally {
      setSalvandoSenha(false);
    }
  }

  async function excluirConta() {
    setErroExclusao("");
    setExcluindo(true);

    try {
      await apiClient.delete("/usuarios/me");
      router.push("/");
      router.refresh();
    } catch (erro) {
      setErroExclusao(erro.message);
      setExcluindo(false);
    }
  }

  return (
    <>
      <section className={styles.secao}>
        <h2 className={styles.secaoTitulo}>Dados da conta</h2>
        <div className={styles.linhaDados}>
          <span>E-mail</span>
          <span>{usuario?.email}</span>
        </div>
        <div className={styles.linhaDados}>
          <span>CPF</span>
          <span>{usuario?.cpf}</span>
        </div>
      </section>

      <form onSubmit={salvarPerfil} className={styles.secao}>
        <h2 className={styles.secaoTitulo}>Editar perfil</h2>
        <Alerta tipo={mensagemPerfil.includes("sucesso") ? "sucesso" : "erro"}>
          {mensagemPerfil}
        </Alerta>
        <Campo
          id="nome"
          rotulo="Nome completo"
          value={perfil.nome}
          onChange={(evento) => setPerfil((atual) => ({ ...atual, nome: evento.target.value }))}
          erro={errosPerfil.nome}
        />
        <Campo
          id="instituicao"
          rotulo="Instituição"
          value={perfil.instituicao}
          onChange={(evento) =>
            setPerfil((atual) => ({ ...atual, instituicao: evento.target.value }))
          }
          erro={errosPerfil.instituicao}
        />
        <CampoSelect
          id="categoria"
          rotulo="Categoria"
          value={perfil.categoria}
          onChange={(evento) =>
            setPerfil((atual) => ({ ...atual, categoria: evento.target.value }))
          }
          erro={errosPerfil.categoria}
        >
          {categorias.map((categoria) => (
            <option key={categoria.valor} value={categoria.valor}>
              {categoria.rotulo}
            </option>
          ))}
        </CampoSelect>
        <Botao type="submit" carregando={salvandoPerfil}>
          Salvar alterações
        </Botao>
      </form>

      <form onSubmit={salvarSenha} className={styles.secao}>
        <h2 className={styles.secaoTitulo}>Alterar senha</h2>
        <Alerta tipo={mensagemSenha.includes("sucesso") ? "sucesso" : "erro"}>
          {mensagemSenha}
        </Alerta>
        <CampoSenha
          id="senhaAtual"
          rotulo="Senha atual"
          value={senhas.senhaAtual}
          onChange={(evento) => setSenhas((atual) => ({ ...atual, senhaAtual: evento.target.value }))}
          erro={errosSenha.senhaAtual}
        />
        <div className={styles.linha}>
          <CampoSenha
            id="novaSenha"
            rotulo="Nova senha"
            value={senhas.novaSenha}
            onChange={(evento) => setSenhas((atual) => ({ ...atual, novaSenha: evento.target.value }))}
            erro={errosSenha.novaSenha}
          />
          <CampoSenha
            id="confirmarNovaSenha"
            rotulo="Confirmar nova senha"
            value={senhas.confirmarNovaSenha}
            onChange={(evento) =>
              setSenhas((atual) => ({ ...atual, confirmarNovaSenha: evento.target.value }))
            }
            erro={errosSenha.confirmarNovaSenha}
          />
        </div>
        <Botao type="submit" carregando={salvandoSenha}>
          Alterar senha
        </Botao>
      </form>

      <section className={`${styles.secao} ${styles.perigo}`}>
        <h2 className={styles.secaoTitulo}>Excluir conta</h2>
        <p className={styles.perigoTexto}>
          Ao excluir sua conta, seus dados pessoais são anonimizados permanentemente,
          conforme a LGPD. Essa ação não pode ser desfeita.
        </p>
        <Alerta>{erroExclusao}</Alerta>
        {!confirmandoExclusao ? (
          <Botao
            type="button"
            variante="perigo"
            onClick={() => setConfirmandoExclusao(true)}
          >
            Excluir minha conta
          </Botao>
        ) : (
          <div className={styles.linha}>
            <Botao type="button" variante="perigo" carregando={excluindo} onClick={excluirConta}>
              Confirmar exclusão
            </Botao>
            <Botao type="button" variante="secundario" onClick={() => setConfirmandoExclusao(false)}>
              Cancelar
            </Botao>
          </div>
        )}
      </section>
    </>
  );
}
