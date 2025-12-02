// =============================================
// 📄 RELATÓRIO DE ENTREGAS – DFL (COMPLETO)
// Compatível com entregas antigas e novas
// =============================================

import { db } from "./firebase-config-v2.js";

import {
  collection,
  getDocs,
  orderBy,
  query
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// Elemento onde o relatório será exibido
const container = document.getElementById("relatorioEntregasContainer");

async function carregarRelatorioEntregas() {
  container.innerHTML = "<p>Carregando entregas...</p>";

  const q = query(collection(db, "entregasManuais"), orderBy("timestamp", "desc"));
  const snap = await getDocs(q);

  if (snap.empty) {
    container.innerHTML = "<p>Nenhuma entrega registrada.</p>";
    return;
  }

  let html = `
    <table class="tabela-relatorio">
      <thead>
        <tr>
          <th>Data</th>
          <th>Motoboy</th>
          <th>Entregas</th>
          <th>Valor Pago</th>
        </tr>
      </thead>
      <tbody>
  `;

  snap.forEach(doc => {
    const d = doc.data();

    const data = d.data || "-";
    const motoboy = d.motoboy || "-";
    const qtd = d.qtd || 0;

    // Compatibilidade com o novo campo
    const valorPago = d.valorPago
      ? `R$ ${Number(d.valorPago).toFixed(2).replace(".", ",")}`
      : "—";

    html += `
      <tr>
        <td>${data}</td>
        <td>${motoboy}</td>
        <td>${qtd}</td>
        <td>${valorPago}</td>
      </tr>
    `;
  });

  html += "</tbody></table>";

  container.innerHTML = html;
}

carregarRelatorioEntregas();