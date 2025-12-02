// =======================================================
//   DFL — RELATÓRIOS (Versão Final Integrada)
// =======================================================

import { db } from "./firebase-config-v2.js";

import {
  collection,
  getDocs,
  query,
  where,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// =======================================================
//  FUNÇÕES DE NAVEGAÇÃO PARA PDFS
// =======================================================

document.getElementById("btnRelatorioDespesas")?.addEventListener("click", () => {
  window.location.href = "pdf-despesas.html";
});

document.getElementById("btnRelatorioEntregas")?.addEventListener("click", () => {
  window.location.href = "pdf-entregas.html";
});

// =======================================================
//     FUNÇÃO EXTRA (caso queira listar relatórios futuros)
// =======================================================

export async function obterDespesasDoDia(dataSelecionada) {
  const q = query(
    collection(db, "despesas"),
    where("data", "==", dataSelecionada)
  );

  const snap = await getDocs(q);
  const lista = [];

  snap.forEach(doc => {
    lista.push({
      descricao: doc.data().descricao,
      valor: doc.data().valor,
      data: doc.data().data
    });
  });

  return lista;
}

export async function obterEntregasManuais(dataSelecionada) {
  const q = query(
    collection(db, "entregasManuais"),
    where("data", "==", dataSelecionada)
  );

  const snap = await getDocs(q);
  const lista = [];

  snap.forEach(doc => {
    lista.push({
      motoboy: doc.data().motoboy,
      quantidade: doc.data().quantidade,
      valorPago: doc.data().valorPago || null,
      data: doc.data().data
    });
  });

  return lista;
}