"use client";

import { useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { valorExportado } from "./useTabela";
import { useToast } from "./ToastProvider";
import styles from "./BotaoExportarTabela.module.scss";

function dataDeHoje() {
  const hoje = new Date();
  const doisDigitos = (numero) => String(numero).padStart(2, "0");
  return `${hoje.getFullYear()}-${doisDigitos(hoje.getMonth() + 1)}-${doisDigitos(hoje.getDate())}`;
}

// Barra acima da tabela com a contagem de registros e o download em Excel do
// que está renderizado: só as linhas que passaram pelos filtros, na ordem
// atual, com os valores formatados como aparecem na tela (sem a coluna Ações).
// `children` entra ao lado do botão de exportar (ex.: ações em lote).
export default function BotaoExportarTabela({ tabela, nomeArquivo, nomeAba = "Dados", children }) {
  const { notificar } = useToast();
  const [exportando, setExportando] = useState(false);
  const { colunas, linhas, linhasVisiveis, temFiltroAtivo } = tabela;

  async function exportar() {
    setExportando(true);

    try {
      // Import sob demanda: a lib só é baixada quando alguém exporta.
      const { default: ExcelJS } = await import("exceljs");
      const planilha = new ExcelJS.Workbook();
      const aba = planilha.addWorksheet(nomeAba.slice(0, 31));

      aba.columns = colunas.map((coluna) => ({ header: coluna.rotulo, key: coluna.chave }));
      linhasVisiveis.forEach((linha) => {
        aba.addRow(Object.fromEntries(colunas.map((coluna) => [coluna.chave, valorExportado(coluna, linha)])));
      });

      aba.getRow(1).font = { bold: true };
      aba.views = [{ state: "frozen", ySplit: 1 }];
      aba.columns.forEach((coluna) => {
        const maior = Math.max(
          ...coluna.values.filter((valor) => valor !== undefined).map((valor) => String(valor).length)
        );
        coluna.width = Math.min(Math.max(maior + 2, 10), 60);
      });

      const buffer = await planilha.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${nomeArquivo}-${dataDeHoje()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      notificar("Não foi possível gerar a planilha. Tente novamente.", "erro");
    } finally {
      setExportando(false);
    }
  }

  return (
    <div className={styles.barra}>
      <p className={styles.contagem}>
        {temFiltroAtivo
          ? `${linhasVisiveis.length} de ${linhas.length} registros`
          : `${linhas.length} ${linhas.length === 1 ? "registro" : "registros"}`}
      </p>
      <div className={styles.acoes}>
        {children}
        <button
          type="button"
          className={styles.botao}
          onClick={exportar}
          disabled={exportando || linhasVisiveis.length === 0}
        >
          <FileSpreadsheet size={16} strokeWidth={1.5} aria-hidden="true" />
          {exportando ? "Gerando..." : "Baixar Excel"}
        </button>
      </div>
    </div>
  );
}

// Botão no mesmo estilo do "Baixar Excel", pra ações em lote na barra.
export function BotaoAcaoTabela({ perigo = false, className = "", children, ...props }) {
  return (
    <button
      type="button"
      className={`${styles.botao} ${perigo ? styles.botaoPerigo : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
