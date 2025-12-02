// ======================================================
//  📊 RELATÓRIOS — DFL
// ======================================================

import { db } from "./firebase-config-v2.js";
import {
  collection,
  getDocs,
  query,
  orderBy,
  where
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// ======================================================
//  REDIRECIONAR PARA O PDF DE ESTOQUE
// ======================================================
document.getElementById("btnRelatorioDespesas")?.addEventListener("click", gerarRelatorioDespesas);
document.getElementById("btnRelatorioEntregas")?.addEventListener("click", gerarRelatorioEntregas);
document.getElementById("btnRelatorioPagamentos")?.addEventListener("click", gerarRelatorioPagamentos);

// ======================================================
//  FUNÇÃO — RELATÓRIO DE DESPESAS
// ======================================================
async function gerarRelatorioDespesas() {
  const q = query(
    collection(db, "despesas"),
    orderBy("data", "desc")
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    alert("Nenhuma despesa registrada.");
    return;
  }

  let html = `
    <h1>Relatório de Despesas</h1>
    <table border="1" cellspacing="0" cellpadding="8">
      <thead>
        <tr>
          <th>Data</th>
          <th>Descrição</th>
          <th>Valor (R$)</th>
        </tr>
      </thead>
      <tbody>
  `;

  let total = 0;

  snap.forEach(doc => {
    const d = doc.data();
    total += Number(d.valor || 0);

    html += `
      <tr>
        <td>${d.data}</td>
        <td>${d.descricao}</td>
        <td>R$ ${Number(d.valor).toFixed(2).replace(".", ",")}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2"><strong>Total</strong></td>
          <td><strong>R$ ${total.toFixed(2).replace(".", ",")}</strong></td>
        </tr>
      </tfoot>
    </table>
  `;

  abrirNovaAba(html);
}

// ======================================================
//  FUNÇÃO — RELATÓRIO DE ENTREGAS MANUAIS
// ======================================================
async function gerarRelatorioEntregas() {
  const q = query(
    collection(db, "entregasManuais"),
    orderBy("data", "desc")
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    alert("Nenhuma entrega registrada.");
    return;
  }

  let html = `
    <h1>Relatório de Entregas Manuais</h1>
    <table border="1" cellspacing="0" cellpadding="8">
      <thead>
        <tr>
          <th>Data</th>
          <th>Motoboy</th>
          <th>Qtd Entregas</th>
        </tr>
      </thead>
      <tbody>
  `;

  let total = 0;

  snap.forEach(doc => {
    const d = doc.data();
    total += Number(d.quantidade);

    html += `
      <tr>
        <td>${d.data}</td>
        <td>${d.motoboy}</td>
        <td>${d.quantidade}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2"><strong>Total de Entregas</strong></td>
          <td><strong>${total}</strong></td>
        </tr>
      </tfoot>
    </table>
  `;

  abrirNovaAba(html);
}

// ======================================================
//  FUNÇÃO — 🧾 RELATÓRIO DE PAGAMENTOS PARA MOTOBOYS
// ======================================================
async function gerarRelatorioPagamentos() {
  const q = query(
    collection(db, "pagamentosMotoboys"),
    orderBy("data", "desc")
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    alert("Nenhum pagamento registrado.");
    return;
  }

  let html = `
    <h1>Relatório de Pagamentos — Motoboys</h1>
    <table border="1" cellspacing="0" cellpadding="8">
      <thead>
        <tr>
          <th>Data</th>
          <th>Motoboy</th>
          <th>Qtd Entregas</th>
          <th>Valor Pago (R$)</th>
        </tr>
      </thead>
      <tbody>
  `;

  let totalGeral = 0;

  snap.forEach(doc => {
    const d = doc.data();
    totalGeral += Number(d.valorPago);

    html += `
      <tr>
        <td>${d.data}</td>
        <td>${d.motoboy}</td>
        <td>${d.qtd}</td>
        <td>R$ ${Number(d.valorPago).toFixed(2).replace(".", ",")}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3"><strong>Total Pago</strong></td>
          <td><strong>R$ ${totalGeral.toFixed(2).replace(".", ",")}</strong></td>
        </tr>
      </tfoot>
    </table>
  `;

  abrirNovaAba(html);
}

// ======================================================
//  UTILITÁRIO — ABRIR NOVA ABA PARA PDF
// ======================================================
function abrirNovaAba(html) {
  const win = window.open("", "_blank");
  win.document.write(`
    <html><head><title>Relatório</title></head><body>
    ${html}
    </body></html>
  `);
  win.document.close();
}