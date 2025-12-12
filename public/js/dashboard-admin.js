// ============================================================
//  DFL — DASHBOARD ADMIN (VERSÃO ESTÁVEL + CAIXA DIÁRIO)
//  ✅ Corrige bug do ESTOQUE (categorias sumindo + PDF não aparecendo)
//  ✅ NÃO remove nenhuma função existente (apenas blinda e organiza)
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
//  🔐 ACESSO APENAS ADMIN
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
const moneyBR = (n) => `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;
const todayISO_BR = () =>
  new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);

function safe(fn) {
  return (...args) => {
    try { return fn(...args); }
    catch (e) { console.error("[DFL ADMIN] Erro:", e); }
  };
}

// ============================================================
//  🎨 COR DO SALDO
// ============================================================
function getClasseSaldo(valor) {
  if (valor > 0) return "positivo";
  if (valor < 0) return "negativo";
  return "neutral";
}

// ============================================================
//  🚪 LOGOUT
// ============================================================
$("logoutAdmin")?.addEventListener("click", safe(async () => {
  await signOut(auth);
  window.location.href = "index.html";
}));

// ============================================================
//  📁 BOTÃO RELATÓRIOS
// ============================================================
$("btnRelatorios")?.addEventListener("click", () => {
  window.location.href = "relatorios.html";
});

// ============================================================
//  ✅ INIT (só roda após autenticar e validar admin)
// ============================================================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  if (!ADMINS.includes(user.uid)) {
    alert("Acesso restrito.");
    window.location.href = "dashboard.html";
    return;
  }

  safe(initEstoqueUI)();
  safe(initPdfButton)();

  await safe(carregarListaMotoboys)();
  await safe(carregarSaldoGeral)();
  await safe(verificarEstoqueHoje)();
  await safe(carregarCaixaHoje)();
  await safe(calcularResumoDia)();

  // 🔹 ETAPA 1 — LOGÍSTICA (ÚLTIMOS 7 DIAS)
  await safe(calcularLogisticaUltimos7Dias)();
});

// ============================================================
//  📌 LISTAR MOTOBOYS
// ============================================================
async function carregarListaMotoboys() {
  const listaEl = $("listaMotoboys");
  if (!listaEl) return;

  listaEl.innerHTML = "<p>Carregando...</p>";

  const snap = await getDocs(collection(db, "motoboys"));

  let html = "";
  snap.forEach((d) => {
    const x = d.data();
    const saldo = Number(x.saldo || 0);

    html += `
      <div class="motoboy-item ${getClasseSaldo(saldo)}">
        <div class="motoboy-info">
          <strong>${x.nome || d.id}</strong>
          <span class="saldo">${moneyBR(saldo)}</span>
        </div>

        <button class="btnPagar"
          data-id="${d.id}"
          data-nome="${x.nome || d.id}">
          💸 Pagar
        </button>
      </div>
    `;
  });

  listaEl.innerHTML = html;

  document.querySelectorAll(".btnPagar").forEach(btn => {
    btn.addEventListener("click", abrirModalPagamento);
  });
}

// ============================================================
//  💰 SALDO GERAL
// ============================================================
async function carregarSaldoGeral() {
  const snap = await getDocs(collection(db, "motoboys"));
  let total = 0;

  snap.forEach((d) => {
    total += Number(d.data().saldo || 0);
  });

  const el = $("saldoGeral");
  if (!el) return;

  el.textContent = moneyBR(total);
  el.className = "admin-value " + getClasseSaldo(total);
}

// ============================================================
//  🔹 ETAPA 1 — LOGÍSTICA (ÚLTIMOS 7 DIAS)
// ============================================================
async function calcularLogisticaUltimos7Dias() {
  const el = $("logisticaSemana");
  if (!el) return;

  const hoje = new Date();
  const seteDiasAtras = new Date();
  seteDiasAtras.setDate(hoje.getDate() - 6);

  const inicio = seteDiasAtras.toISOString().slice(0, 10);
  const fim = todayISO_BR();

  const q = query(
    collection(db, "entregasManuais"),
    where("data", ">=", inicio),
    where("data", "<=", fim)
  );

  const snap = await getDocs(q);

  let total = 0;
  snap.forEach((d) => {
    total += Number(d.data().valorPago || 0);
  });

  el.textContent = moneyBR(total);
}

// ============================================================
//  📦 ESTOQUE — CATEGORIAS / ITENS
// ============================================================
const SUBITENS = {
  frios: [
    "Bacon","Carne Moída/Artesanais","Cheddar","Filé de Frango",
    "Hambúrguer","Mussarela","Presunto","Salsicha"
  ],
  refrigerantes: [
    "Coca 200ml","Coca 310ml","Coca 310ml Zero","Coca 1L",
    "Coca 1L Zero","Coca 2L","Del Valle 450ml Uva",
    "Del Valle 450ml Laranja","Fanta 1L","Kuat 2L"
  ],
  embalagens: [
    "Bobina","Dogueira","Hamburgueira","Papel Kraft",
    "Saco Plástico","Sacola 30x40","Sacola 38x48"
  ],
  paes: ["Pão Hambúrguer","Pão Hot Dog"],
  hortifruti: [
    "Alface","Batata Palha","Cebola","Cebolinha",
    "Milho","Óleo","Ovo","Tomate"
  ],
  outros_extra: ["Outro (Preencher manualmente)"]
};

const CATEGORIAS = [
  { id: "frios", label: "Frios" },
  { id: "refrigerantes", label: "Refrigerantes" },
  { id: "embalagens", label: "Embalagens" },
  { id: "paes", label: "Pães" },
  { id: "hortifruti", label: "Hortifruti" },
  { id: "outros_extra", label: "Outros / Extra" }
];

function initEstoqueUI() {
  const categoriaSel = $("estoqueCategoria");
  const itemSel = $("estoqueItem");
  if (!categoriaSel || !itemSel) return;

  categoriaSel.innerHTML =
    `<option value="">Selecione...</option>` +
    CATEGORIAS.map(c => `<option value="${c.id}">${c.label}</option>`).join("");

  itemSel.innerHTML = `<option value="">Selecione a categoria...</option>`;

  categoriaSel.addEventListener("change", () => {
    const lista = SUBITENS[categoriaSel.value] || [];
    itemSel.innerHTML =
      `<option value="">Selecione...</option>` +
      lista.map(i => `<option value="${i}">${i}</option>`).join("");
  });
}

// ============================================================
//  📦 BOTÃO PDF
// ============================================================
function initPdfButton() {
  $("btnGerarPdfEstoque")?.addEventListener("click", () => {
    window.location.href = "pdf-estoque.html";
  });
}

async function verificarEstoqueHoje() {
  const btn = $("btnGerarPdfEstoque");
  if (!btn) return;

  const hoje = todayISO_BR();
  const q = query(collection(db, "estoqueDia"), where("data", "==", hoje));
  const snap = await getDocs(q);

  btn.style.display = snap.size > 0 ? "block" : "none";
}

// ============================================================
//  💸 MODAL PAGAMENTO
// ============================================================
const modal = $("modalPagamento");
const inputValorPagamento = $("modalValorPagamento");
const confirmarPagamentoBtn = $("confirmarPagamento");
const cancelarPagamentoBtn = $("cancelarPagamento");
const modalNomeMotoboy = $("modalNomeMotoboy");

let pagamentoMotoboyId = null;

function abrirModalPagamento(e) {
  const btn = e.currentTarget;
  pagamentoMotoboyId = btn.dataset.id;
  if (modalNomeMotoboy) modalNomeMotoboy.textContent = btn.dataset.nome || "";
  modal?.classList.remove("hidden");
}

cancelarPagamentoBtn?.addEventListener("click", () => {
  modal?.classList.add("hidden");
  pagamentoMotoboyId = null;
  inputValorPagamento.value = "";
});