// ============================================================
//  DFL — DASHBOARD ADMIN v3.1 (ESTÁVEL + AVULSOS)
// ============================================================

import { auth, db } from "./firebase-config-v2.js";

import {
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc,
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

function normalizeId(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function safe(fn) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (e) {
      console.error("[DFL ADMIN] ERRO:", e);
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
    background: rgba(229,57,53,.95);
    color: #fff;
    padding: 12px;
    border-radius: 12px;
    font-size: 13px;
  `;
  box.innerHTML = `<strong>Erro no painel:</strong><br>${e.message || e}`;
  document.body.appendChild(box);
}

// ============================================================
//  🎨 SALDO
// ============================================================
function getClasseSaldo(v) {
  if (v > 0) return "positivo";
  if (v < 0) return "negativo";
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

  $("btnMiniPDV")?.addEventListener("click", () => {
    window.location.href = "pdv.html";
  });
}

// ============================================================
//  🛵 MOTOBOYS (FIXOS + AVULSOS)
// ============================================================
async function carregarListaMotoboys() {
  const lista = $("listaMotoboys");
  if (!lista) return;

  lista.innerHTML = "<p>Carregando...</p>";

  const snap = await getDocs(collection(db, "motoboys"));

  const fixos = [];
  const avulsos = [];

  snap.forEach(d => {
    const data = d.data();
    const item = {
      id: d.id,
      nome: data.nome || d.id,
      saldo: Number(data.saldo || 0),
      tipo: data.tipo || "fixo"
    };

    if (item.tipo === "avulso") avulsos.push(item);
    else fixos.push(item);
  });

  let html = "";

  [...fixos, ...avulsos].forEach(m => {
    html += `
      <div class="motoboy-item ${getClasseSaldo(m.saldo)}">
        <div class="motoboy-info">
          <strong>${m.nome}</strong>
          <span class="saldo">${moneyBR(m.saldo)}</span>
        </div>
        ${m.tipo !== "avulso" ? `
        <button class="btnPagar" data-id="${m.id}" data-nome="${m.nome}">
          💸 Pagar
        </button>` : ""}
      </div>
    `;
  });

  lista.innerHTML = html;

  document.querySelectorAll(".btnPagar").forEach(btn => {
    btn.addEventListener("click", abrirModalPagamento);
  });
}

async function carregarSaldoGeral() {
  const snap = await getDocs(collection(db, "motoboys"));
  let total = 0;

  snap.forEach(d => {
    total += Number(d.data().saldo || 0);
  });

  const el = $("saldoGeral");
  if (!el) return;

  el.textContent = moneyBR(total);
  el.className = "admin-value " + getClasseSaldo(total);
}

// ============================================================
//  🛵 REGISTRAR ENTREGA MANUAL
// ============================================================
function bindEntregas() {
  const selectMotoboy = $("entregaMotoboy");
  const grupoOutro = $("grupoMotoboyOutro");

  selectMotoboy?.addEventListener("change", () => {
    grupoOutro?.classList.toggle("hidden", selectMotoboy.value !== "outro");
  });

  $("btnSalvarEntregaManual")?.addEventListener("click", safe(async () => {
    const tipo = selectMotoboy.value;
    const qtd = Number($("entregaQtd").value || 0);
    const valorManual = Number($("valorPagoMotoboy").value || 0);
    const dataRaw = $("entregaData").value;
    const nomeOutro = $("entregaMotoboyOutro").value.trim();

    if (!qtd || !dataRaw) {
      alert("Preencha tudo.");
      return;
    }

    const data = new Date(dataRaw + "T12:00:00").toISOString().slice(0, 10);

    let nomeMotoboy = "";
    let valorPago = 0;

    if (tipo === "outro") {
      if (!nomeOutro) {
        alert("Informe o nome do motoboy.");
        return;
      }

      nomeMotoboy = nomeOutro;
      valorPago = valorManual;

      const id = normalizeId(nomeOutro);
      const ref = doc(db, "motoboys", id);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        await setDoc(ref, {
          nome: nomeOutro,
          saldo: 0,
          tipo: "avulso"
        });
      }
    }

    await addDoc(collection(db, "entregasManuais"), {
      nomeMotoboy,
      quantidade: qtd,
      valorPago,
      data,
      timestamp: Date.now()
    });

    alert("Entrega registrada!");
    await carregarListaMotoboys();
    await carregarSaldoGeral();
  }));
}

// ============================================================
//  💸 MODAL (lógica intacta – UI vem depois)
// ============================================================
const modal = $("modalPagamento");
const modalNomeMotoboy = $("modalNomeMotoboy");
const inputValorPagamento = $("modalValorPagamento");
const confirmarPagamentoBtn = $("confirmarPagamento");
const cancelarPagamentoBtn = $("cancelarPagamento");

let pagamentoMotoboyId = null;

function abrirModalPagamento(e) {
  pagamentoMotoboyId = e.currentTarget.dataset.id;
  modalNomeMotoboy.textContent = e.currentTarget.dataset.nome;
  modal.classList.remove("hidden");
}

cancelarPagamentoBtn?.addEventListener("click", () => {
  modal.classList.add("hidden");
  inputValorPagamento.value = "";
  pagamentoMotoboyId = null;
});

confirmarPagamentoBtn?.addEventListener("click", safe(async () => {
  const valor = Number(inputValorPagamento.value || 0);
  if (!valor) return alert("Valor inválido");

  const ref = doc(db, "motoboys", pagamentoMotoboyId);
  const snap = await getDoc(ref);

  let saldo = Number(snap.data().saldo || 0);
  saldo -= valor;

  await updateDoc(ref, { saldo });

  modal.classList.add("hidden");
  inputValorPagamento.value = "";

  await carregarListaMotoboys();
  await carregarSaldoGeral();

  alert("Pagamento registrado!");
}));

// ============================================================
//  INIT
// ============================================================
function init() {
  bindHeaderButtons();
  bindEntregas();
}

document.addEventListener("DOMContentLoaded", () => {
  init();

  onAuthStateChanged(auth, async user => {
    if (!user || !ADMINS.includes(user.uid)) {
      window.location.href = "index.html";
      return;
    }

    await carregarListaMotoboys();
    await carregarSaldoGeral();
  });
});