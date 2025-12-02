// ===================================================================
// 📊 DFL — relatorios.js (VERSÃO COMPLETA E FINAL)
// Geração de PDFs: Estoque, Despesas, Entregas, Financeiro e Motoboys
// ===================================================================

import { db } from "./firebase-config-v2.js";
import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// jsPDF + AutoTable (UMD fix)
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
      "Relatório de Despesas – DFL",
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
    const snap = await getDocs(collection(db, "entregasManuais"));
    const linhas = [];

    snap.forEach(d => {
      const x = d.data();
      linhas.push([
        x.motoboyNome || x.motoboy, // exibe nome bonito
        x.quantidade,
        x.data
      ]);
    });

    if (linhas.length === 0) {
      alert("Nenhuma entrega registrada.");
      return;
    }

    gerarTabelaPDF(
      "Relatório de Entregas Manuais – DFL",
      ["Motoboy", "Qtd", "Data"],
      linhas,
      "entregas_manuais.pdf"
    );

  } catch (e) {
    console.error(e);
    alert("Erro ao gerar relatório de entregas.");
  }
});




// ===================================================================
// 📊 RELATÓRIO FINANCEIRO GERAL
// ===================================================================
document.getElementById("btnRelatorioFinanceiro")?.addEventListener("click", async () => {
  try {
    const despesasSnap = await getDocs(collection(db, "despesas"));
    const entregasSnap = await getDocs(collection(db, "entregasManuais"));

    let totalDespesas = 0;
    let totalCreditos = 0;

    despesasSnap.forEach(d => totalDespesas += Number(d.data().valor || 0));
    entregasSnap.forEach(d => {
      const x = d.data();
      totalCreditos += Number(x.valorPago || 0);
    });

    const linhas = [
      ["Total Despesas", "R$ " + totalDespesas.toFixed(2).replace(".", ",")],
      ["Total Pago a Motoboys", "R$ " + totalCreditos.toFixed(2).replace(".", ",")],
      ["Saldo Final", "R$ " + (totalCreditos - totalDespesas).toFixed(2).replace(".", ",")]
    ];

    gerarTabelaPDF(
      "Relatório Financeiro Geral – DFL",
      ["Categoria", "Valor"],
      linhas,
      "financeiro_geral.pdf"
    );

  } catch (e) {
    console.error(e);
    alert("Erro ao gerar relatório financeiro.");
  }
});




// ===================================================================
// 💸 RELATÓRIO DE PAGAMENTOS PARA MOTOBOYS
// ===================================================================
export async function gerarRelatorioPagamentos() {
  try {
    const snap = await getDocs(collection(db, "entregasManuais"));
    const linhas = [];

    snap.forEach(d => {
      const x = d.data();

      linhas.push([
        x.motoboyNome || x.motoboy,
        x.quantidade,
        "R$ " + Number(x.valorPago || 0).toFixed(2).replace(".", ","),
        x.data
      ]);
    });

    if (linhas.length === 0) {
      alert("Nenhum pagamento encontrado.");
      return;
    }

    gerarTabelaPDF(
      "Relatório de Pagamentos – Motoboys",
      ["Motoboy", "Qtd Entregas", "Valor Pago", "Data"],
      linhas,
      "pagamentos_motoboys.pdf"
    );

  } catch (e) {
    console.error(e);
    alert("Erro ao gerar relatório de pagamentos.");
  }
}