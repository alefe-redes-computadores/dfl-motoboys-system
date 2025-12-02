// ===================================================================
// 📊 DFL — relatorios.js (VERSÃO FINAL)
// Geração de PDFs: Estoque, Despesas, Entregas, Motoboys e Financeiro
// ===================================================================

import { db } from "./firebase-config-v2.js";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// jsPDF + AutoTable (já carregados no HTML)
window.jsPDF = window.jspdf?.jsPDF;

// ===================================================================
// 📌 Função genérica para gerar PDF
// ===================================================================
function gerarTabelaPDF(titulo, cabecalho, linhas, nomeArquivo) {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text(titulo, 10, 15);

  doc.autoTable({
    startY: 25,
    head: [cabecalho],
    body: linhas
  });

  doc.save(nomeArquivo);
}

// ===================================================================
// 💰 RELATÓRIO DE DESPESAS
// ===================================================================
document.getElementById("btnRelatorioDespesas")?.addEventListener("click", async () => {
  try {
    const snap = await getDocs(query(collection(db, "despesas"), orderBy("data", "desc")));
    const linhas = [];

    snap.forEach(d => {
      const x = d.data();
      linhas.push([
        x.descricao,
        "R$ " + Number(x.valor || 0).toFixed(2).replace(".", ","),
        x.data
      ]);
    });

    if (linhas.length === 0) {
      alert("Nenhuma despesa registrada.");
      return;
    }

    gerarTabelaPDF(
      "Relatório de Despesas",
      ["Descrição", "Valor", "Data"],
      linhas,
      "despesas.pdf"
    );

  } catch (e) {
    console.error(e);
    alert("Erro ao gerar relatório de despesas.");
  }
});

// ===================================================================
// 🛵 RELATÓRIO DE ENTREGAS MANUAIS
// ===================================================================
document.getElementById("btnRelatorioEntregas")?.addEventListener("click", async () => {
  try {
    const snap = await getDocs(query(collection(db, "entregasManuais"), orderBy("data", "desc")));
    const linhas = [];

    snap.forEach(d => {
      const x = d.data();
      linhas.push([
        x.nomeMotoboy,
        x.quantidade,
        "R$ " + Number(x.valorPago || 0).toFixed(2).replace(".", ","),
        x.data
      ]);
    });

    if (linhas.length === 0) {
      alert("Nenhum registro de entrega encontrado.");
      return;
    }

    gerarTabelaPDF(
      "Relatório de Entregas / Pagamentos p/ Motoboy",
      ["Motoboy", "Qtd Entregas", "Valor Pago", "Data"],
      linhas,
      "entregas_motoboy.pdf"
    );

  } catch (e) {
    console.error(e);
    alert("Erro ao gerar relatório de entregas.");
  }
});

// ===================================================================
// 🧮 RELATÓRIO FINANCEIRO GERAL
// ===================================================================
document.getElementById("btnRelatorioFinanceiro")?.addEventListener("click", async () => {
  try {
    const despesasSnap = await getDocs(collection(db, "despesas"));
    const entregasSnap = await getDocs(collection(db, "entregasManuais"));

    let totalDespesas = 0;
    let totalPagamentosMotoboy = 0;

    despesasSnap.forEach(d => totalDespesas += Number(d.data().valor || 0));
    entregasSnap.forEach(d => totalPagamentosMotoboy += Number(d.data().valorPago || 0));

    const saldo = totalDespesas + totalPagamentosMotoboy;

    const linhas = [
      ["Total Despesas", "R$ " + totalDespesas.toFixed(2).replace(".", ",")],
      ["Pagamentos p/ Motoboys", "R$ " + totalPagamentosMotoboy.toFixed(2).replace(".", ",")],
      ["TOTAL GERAL", "R$ " + saldo.toFixed(2).replace(".", ",")]
    ];

    gerarTabelaPDF(
      "Relatório Financeiro Geral",
      ["Categoria", "Valor"],
      linhas,
      "financeiro_geral.pdf"
    );

  } catch (e) {
    console.error(e);
    alert("Erro ao gerar relatório financeiro geral.");
  }
});