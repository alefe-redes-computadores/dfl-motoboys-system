// ===================================================================
// 📊 DFL — relatorios.js
// Geração de PDFs: Estoque, Despesas, Entregas e Financeiro Geral
// ===================================================================

import { db } from "./firebase-config-v2.js";
import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// jsPDF + AutoTable (UMD)
window.jsPDF = window.jspdf?.jsPDF;


// ===================================================================
// 📌 Função genérica para gerar PDF com jsPDF + AutoTable
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
// 📦 RELATÓRIO DESPESAS
// ===================================================================
document.getElementById("btnRelatorioDespesas")?.addEventListener("click", async () => {
  try {
    const snap = await getDocs(collection(db, "despesas"));
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
    alert("Erro ao gerar relatório.");
  }
});



// ===================================================================
// 🛵 RELATÓRIO ENTREGAS MANUAIS
// ===================================================================
document.getElementById("btnRelatorioEntregas")?.addEventListener("click", async () => {
  try {
    const snap = await getDocs(collection(db, "entregasManuais"));
    const linhas = [];

    snap.forEach(d => {
      const x = d.data();
      linhas.push([
        x.motoboy,
        x.quantidade,
        x.data
      ]);
    });

    if (linhas.length === 0) {
      alert("Nenhuma entrega manual registrada.");
      return;
    }

    gerarTabelaPDF(
      "Relatório de Entregas Manuais",
      ["Motoboy", "Qtd", "Data"],
      linhas,
      "entregas_manuais.pdf"
    );

  } catch (e) {
    console.error(e);
    alert("Erro ao gerar relatório.");
  }
});



// ===================================================================
// 💰 RELATÓRIO FINANCEIRO GERAL
// Combinação: despesas + entregas (crédito dos motoboys)
// ===================================================================
document.getElementById("btnRelatorioFinanceiro")?.addEventListener("click", async () => {
  try {
    const despesasSnap = await getDocs(collection(db, "despesas"));
    const entregasSnap = await getDocs(collection(db, "entregasManuais"));

    let totalDespesas = 0;
    let totalEntregas = 0;

    despesasSnap.forEach(d => totalDespesas += Number(d.data().valor || 0));
    entregasSnap.forEach(d => totalEntregas += Number(d.data().quantidade || 0) * 2);

    const linhas = [
      ["Total Despesas", "R$ " + totalDespesas.toFixed(2).replace(".", ",")],
      ["Crédito Entregas", "R$ " + totalEntregas.toFixed(2).replace(".", ",")],
      ["Saldo Final", "R$ " + (totalEntregas - totalDespesas).toFixed(2).replace(".", ",")]
    ];

    gerarTabelaPDF(
      "Relatório Financeiro Geral",
      ["Categoria", "Valor"],
      linhas,
      "financeiro_geral.pdf"
    );

  } catch (e) {
    console.error(e);
    alert("Erro ao gerar relatório.");
  }
});