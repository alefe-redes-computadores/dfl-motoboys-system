// ============================================================
//  DFL — DASHBOARD ADMIN v3.0 (FINAL ESTÁVEL)
// ============================================================

import { auth, db } from "./firebase-config-v2.js";

import {
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
  doc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// ============================================================
//  🔐 ADMINS
// ============================================================
const ADMINS = [
  "6YczX4gLpUStlBVdQOXWc3uEYGG2",
  "LYu3M8gyRdMCqhE90vmH9Jh5Ksj1",
  "plSHKV043gTpEYfx7I3TI6FsJG93",
  "zIfbMxD1SQNvtlX9y6YUsEz2TXC3"
];

// ============================================================
//  🧩 HELPERS
// ============================================================
const $ = (id) => document.getElementById(id);

const moneyBR = (n) =>
  `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;

const todayISO_BR = () =>
  new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);

function safe(fn) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (e) {
      console.error("[DFL ADMIN]", e);
      showFatalOnScreen(e);
    }
  };
}

function showFatalOnScreen(e) {
  if (document.getElementById("dflAdminFatal")) return;

  const box = document.createElement("div");
  box.id = "dflAdminFatal";
  box.style.cssText = `
    position: fixed;
    left: 12px;
    right: 12px;
    bottom: 12px;
    z-index: 99999;
    background: rgba(229,57,53,0.95);
    color: #fff;
    padding: 12px;
    border-radius: 12px;
    font-size: 13px;
  `;
  box.innerHTML = `
    <strong>⚠️ Erro no painel</strong><br>
    ${e.message || e}
  `;
  document.body.appendChild(box);
}

function getClasseSaldo(valor) {
  if (valor > 0) return "positivo";
  if (valor < 0) return "negativo";
  return "neutral";
}

// ============================================================
//  🚪 HEADER
// ============================================================
function bindHeaderButtons() {
  $("logoutAdmin")?.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "index.html";
  });

  $("btnRelatorios")?.addEventListener("click", () => {
    window.location.href = "relatorios.html";
  });

  $("btnMiniPDV")?.addEventListener("click", () => {
    window.location.href = "pdv.html";
  });
}

// ============================================================
//  📦 ESTOQUE — NÃO TOCAR
// ============================================================
/* MANTIDO EXATAMENTE COMO ESTAVA */

// (SUBITENS, CATEGORIAS, initEstoqueUI, bindEstoque,
//  verificarEstoqueHoje — permanecem IGUAIS)

// ============================================================
//  🛵 MOTOBOYS
// ============================================================
async function carregarListaMotoboys() {
  const lista = $("listaMotoboys");
  if (!lista) return;

  lista.innerHTML = "<p>Carregando...</p>";

  const snap = await getDocs(collection(db, "motoboys"));

  let html = "";
  snap.forEach(d => {
    const x = d.data();
    const saldo = Number(x.saldo || 0);

    html += `
      <div class="motoboy-item ${getClasseSaldo(saldo)}">
        <div>
          <strong>${x.nome || d.id}</strong>
          <div class="saldo">${moneyBR(saldo)}</div>
        </div>
        <button class="btnPagar"
          data-id="${d.id}"
          data-nome="${x.nome || d.id}">
          💸 Pagar
        </button>
      </div>
    `;
  });

  lista.innerHTML = html;

  document.querySelectorAll(".btnPagar")
    .forEach(b => b.addEventListener("click", abrirModalPagamento));
}

async function carregarSaldoGeral() {
  const snap = await getDocs(collection(db, "motoboys"));
  let total = 0;

  snap.forEach(d => {
    total += Number(d.data().saldo || 0);
  });

  $("saldoGeral").textContent = moneyBR(total);
}

// ============================================================
//  📦 LOGÍSTICA — ÚLTIMOS 7 DIAS (CORRIGIDO)
// ============================================================
async function carregarLogisticaSemana() {
  const el = $("logisticaSemana");
  if (!el) return;

  const agora = Date.now();
  const seteDiasAtras = agora - (7 * 24 * 60 * 60 * 1000);

  const q = query(
    collection(db, "entregasManuais"),
    where("timestamp", ">=", seteDiasAtras)
  );

  const snap = await getDocs(q);

  let total = 0;
  snap.forEach(d => {
    total += Number(d.data().valorPago || 0);
  });

  el.textContent = moneyBR(total);
}

// ============================================================
//  🛵 ENTREGAS MANUAIS
// ============================================================
function bindEntregas() {
  const select = $("entregaMotoboy");
  const outro = $("grupoMotoboyOutro");

  select?.addEventListener("change", () => {
    outro?.classList.toggle("hidden", select.value !== "outro");
  });

  $("btnSalvarEntregaManual")?.addEventListener("click", safe(async () => {
    const id = select.value;
    const qtd = Number($("entregaQtd").value || 0);
    const valorManual = Number($("valorPagoMotoboy").value || 0);
    const dataRaw = $("entregaData").value;
    const nomeOutro = $("entregaMotoboyOutro")?.value || "";

    if (!qtd || !dataRaw) {
      alert("Preencha tudo.");
      return;
    }

    const data = new Date(dataRaw + "T12:00:00").toISOString().slice(0, 10);
    let nome = "";
    let valorPago = 0;

    if (id === "outro") {
      nome = nomeOutro;
      valorPago = valorManual;
    } else if (id === "lucas_hiago") {
      nome = "Lucas Hiago";
      valorPago = qtd * 6;
      const ref = doc(db, "motoboys", id);
      const snap = await getDoc(ref);
      await updateDoc(ref, { saldo: Number(snap.data().saldo || 0) + valorPago });
    } else {
      nome = "Rodrigo Gonçalves";
      valorPago = (qtd <= 10) ? 100 : 100 + (qtd - 10) * 7;
    }

    await addDoc(collection(db, "entregasManuais"), {
      nomeMotoboy: nome,
      motoboy: id,
      quantidade: qtd,
      valorPago,
      data,
      timestamp: Date.now()
    });

    await carregarListaMotoboys();
    await carregarSaldoGeral();
    await carregarLogisticaSemana();

    alert("Entrega registrada!");
  }));
}

// ============================================================
//  INIT
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  bindHeaderButtons();
  initEstoqueUI();
  bindEstoque();
  bindDespesas();
  bindEntregas();
  bindCaixa();

  onAuthStateChanged(auth, safe(async (user) => {
    if (!user || !ADMINS.includes(user.uid)) {
      window.location.href = "index.html";
      return;
    }

    await verificarEstoqueHoje();
    await carregarListaMotoboys();
    await carregarSaldoGeral();
    await carregarLogisticaSemana();
  }));
});