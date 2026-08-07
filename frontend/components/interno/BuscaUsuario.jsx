"use client";

import { useEffect, useRef, useState } from "react";
import CampoTexto from "./CampoTexto";
import { apiClient } from "@/lib/apiClient";
import { formatarCpf } from "@/lib/cpf";
import styles from "./BuscaUsuario.module.scss";

export default function BuscaUsuario({ rotulo = "Buscar participante", usuarioSelecionado, onSelecionar, erro }) {
  const [termo, setTermo] = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const temporizadorRef = useRef(null);

  useEffect(() => () => clearTimeout(temporizadorRef.current), []);

  function aoDigitar(valor) {
    setTermo(valor);
    clearTimeout(temporizadorRef.current);

    if (valor.trim().length < 2) {
      setResultados([]);
      return;
    }

    temporizadorRef.current = setTimeout(async () => {
      setBuscando(true);
      try {
        const dados = await apiClient.get(`/usuarios/busca?termo=${encodeURIComponent(valor.trim())}`);
        setResultados(dados?.usuarios || []);
      } catch {
        setResultados([]);
      } finally {
        setBuscando(false);
      }
    }, 400);
  }

  function selecionar(usuario) {
    onSelecionar(usuario);
    setTermo("");
    setResultados([]);
  }

  if (usuarioSelecionado) {
    return (
      <div className={styles.selecionado}>
        <div>
          <p className={styles.selecionadoNome}>{usuarioSelecionado.nome}</p>
          <p className={styles.selecionadoDetalhe}>
            {usuarioSelecionado.email}
            {usuarioSelecionado.cpf ? ` · ${formatarCpf(usuarioSelecionado.cpf)}` : ""}
          </p>
        </div>
        <button type="button" className={styles.botaoTrocar} onClick={() => onSelecionar(null)}>
          Trocar
        </button>
      </div>
    );
  }

  return (
    <div className={styles.grupo}>
      <CampoTexto
        id="busca-usuario"
        rotulo={`${rotulo} (nome, e-mail ou CPF)`}
        value={termo}
        onChange={(evento) => aoDigitar(evento.target.value)}
        erro={erro}
      />
      {buscando && <p className={styles.status}>Buscando...</p>}
      {!buscando && resultados.length > 0 && (
        <ul className={styles.resultados}>
          {resultados.map((usuario) => (
            <li key={usuario.id}>
              <button
                type="button"
                className={styles.resultado}
                onClick={() => selecionar(usuario)}
              >
                <span className={styles.resultadoNome}>{usuario.nome}</span>
                <span className={styles.resultadoDetalhe}>
                  {usuario.email}
                  {usuario.cpf ? ` · ${formatarCpf(usuario.cpf)}` : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {!buscando && termo.trim().length >= 2 && resultados.length === 0 && (
        <p className={styles.status}>Nenhum usuário encontrado.</p>
      )}
    </div>
  );
}
