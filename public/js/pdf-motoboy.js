// ============================================================
// 📄 PDF MOTOboy – Rodrigo Gonçalves (DFL)
// ============================================================

import { db } from "../firebase-config-v2.js";

import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// ============================================================
const MOTOBOY_ID = "rodrigo_goncalves";

// ============================================================
function money(n) {
  return `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;
}

// ============================================================
async function carregarUltimoFechamento() {
  const hoje = new Date().toISOString().slice(0, 10);

  document.getElementById("dataRelatorio").textContent =
    hoje.split("-").reverse().join("/");

  const q = query(
    collection(db, "historicoMotoboy"),
    where("motoboyId", "==", MOTOBOY_ID),
    orderBy("timestamp", "desc"),
    limit(1)
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    alert("Nenhum fechamento encontrado.");
    return;
  }

  const d = snap.docs[0].data();

  document.getElementById("pdfEntregas").textContent = d.entregas;
  document.getElementById("pdfGanho").textContent = money(d.ganhoEntregas);
  document.getElementById("pdfDinheiro").textContent = money(d.dinheiroRecebido);
  document.getElementById("pdfConsumo").textContent = money(d.consumo);
  document.getElementById("pdfSaldoDia").textContent = money(d.saldoDoDia);

  document.getElementById("tEntregas").textContent = d.entregas;
  document.getElementById("tGanho").textContent = money(d.ganhoEntregas);
  document.getElementById("tDinheiro").textContent = money(d.dinheiroRecebido);
  document.getElementById("tConsumo").textContent = money(d.consumo);
  document.getElementById("tSaldo").textContent = money(d.saldoDoDia);
}

// ============================================================
document.addEventListener("DOMContentLoaded", carregarUltimoFechamento);