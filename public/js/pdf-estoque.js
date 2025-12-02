// ============================================================
//  📄 Gerador de PDF — Estoque do Dia (MODULARIZADO)
//  Projeto: Painel Administrativo DFL
// ============================================================

import { db } from "./firebase-config-v2.js";

import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

async function gerarPDF() {
  try {
    const hoje = new Date().toISOString().slice(0, 10);

    // 🔎 Busca estoque do dia no Firestore
    const q = query(
      collection(db, "estoqueDia"),
      where("data", "==", hoje)
    );

    const snap = await getDocs(q);
    const itens = [];

    snap.forEach((doc) => {
      const x = doc.data();
      itens.push([x.categoria, x.item, x.quantidade, x.data]);
    });

    if (itens.length === 0) {
      alert("Nenhum estoque registrado hoje.");
      window.location.href = "dashboard-admin.html";
      return;
    }

    // =======================
    //  📄 GERANDO PDF
    // =======================
    const { jsPDF } = window;
    const pdf = new jsPDF();

    pdf.setFontSize(18);
    pdf.text(`Relatório de Estoque - ${hoje}`, 10, 15);

    pdf.autoTable({
      startY: 25,
      head: [["Categoria", "Item", "Quantidade", "Data"]],
      body: itens
    });

    // Salvar PDF
    pdf.save(`estoque_${hoje}.pdf`);

    // Voltar ao painel
    window.location.href = "dashboard-admin.html";

  } catch (erro) {
    console.error("Erro ao gerar PDF:", erro);
    alert("Erro ao gerar PDF. Verifique o console.");
  }
}

// Inicia automaticamente
gerarPDF();