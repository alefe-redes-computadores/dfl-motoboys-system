// ===================================================================
// 📊 DFL — relatorios.js
// Geração de PDFs: Despesas, Entregas, Pagamentos e Financeiro Geral
// ===================================================================

import { db } from "./firebase-config-v2.js";
import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// Compatibilidade jsPDF UMD
window.jsPDF = window.jspdf?.jsPDF;

// ===================================================================
// 📌 Função genérica de criação de PDF
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
// 🛵 RELATÓRIO DE ENTREGAS
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
      alert("Nenhuma entrega registrada.");
      return;
    }

    gerarTabelaPDF(
      "Relatório de Entregas",
      ["Motoboy", "Qtd", "Data"],
      linhas,
      "entregas.pdf"
    );

  } catch (e) {
    console.error(e);
    alert("Erro ao gerar relatório de entregas.");
  }
});

// ===================================================================
// 🧾 RELATÓRIO DE PAGAMENTOS PARA MOTOBOYS
// ===================================================================
document.getElementById("btnRelatorioPagamentos")?.addEventListener("click", async () => {
  try {
    const snap = await getDocs(collection(db, "pagamentosMotoboy"));
    const linhas = [];

    snap.forEach(d => {
      const x = d.data();
      linhas.push([
        x.motoboy,
        x.entregas,
        "R$ " + Number(x.valorPago || 0).toFixed(2).replace(".", ","),
        x.data
      ]);
    });

    if (linhas.length === 0) {
      alert("Nenhum pagamento registrado.");
      return;
    }

    gerarTabelaPDF(
      "Relatório de Pagamentos de Motoboys",
      ["Motoboy", "Entregas", "Valor Pago", "Data"],
      linhas,
      "pagamentos_motoboys.pdf"
    );

  } catch (e) {
    console.error(e);
    alert("Erro ao gerar relatório de pagamentos.");
  }
});

// ===================================================================
// 💵 RELATÓRIO FINANCEIRO GERAL (opcional)
// ===================================================================
// Se quiser ativar, posso incluir no HTML também