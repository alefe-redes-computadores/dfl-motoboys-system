// ============================================================
// 📄 PDF MOTOboy – DFL
// Rodrigo Gonçalves (VERSÃO FINAL ESTÁVEL)
// ============================================================

import { db } from "./firebase-config-v2.js";

import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// ============================================================
// ⚙️ CONFIG
// ============================================================
const MOTOBOY_ID = "rodrigo_goncalves";

// ============================================================
// 🧮 HELPERS
// ============================================================
const money = (v) =>
  `R$ ${Number(v || 0).toFixed(2).replace(".", ",")}`;

const todayBR = () =>
  new Date().toISOString().slice(0, 10).split("-").reverse().join("/");

// ============================================================
// 📄 CARREGAR RELATÓRIO DO DIA (ÚLTIMO FECHAMENTO)
// ============================================================
async function carregarRelatorio() {
  try {
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

    // 🔹 ELEMENTOS DO PDF
    const elData       = document.getElementById("pdfData");
    const elEntregas   = document.getElementById("pdfEntregas");
    const elGanho      = document.getElementById("pdfGanho");
    const elDinheiro   = document.getElementById("pdfDinheiro");
    const elConsumo    = document.getElementById("pdfConsumo");
    const elSaldoDia   = document.getElementById("pdfSaldoDia");

    if (elData)     elData.textContent     = todayBR();
    if (elEntregas) elEntregas.textContent = d.entregas;
    if (elGanho)    elGanho.textContent    = money(d.ganhoEntregas);
    if (elDinheiro) elDinheiro.textContent = money(d.dinheiroRecebido);
    if (elConsumo)  elConsumo.textContent  = money(d.consumo);
    if (elSaldoDia) elSaldoDia.textContent = money(d.saldoDoDia);

  } catch (e) {
    console.error("Erro ao carregar PDF:", e);
    alert("Erro ao gerar relatório.");
  }
}

// ============================================================
// 🚀 INIT
// ============================================================
document.addEventListener("DOMContentLoaded", carregarRelatorio);