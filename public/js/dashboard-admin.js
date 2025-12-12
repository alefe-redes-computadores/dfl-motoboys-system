// ============================================================
//  DFL — DASHBOARD ADMIN (VERSÃO ESTÁVEL + PDV FINANCEIRO)
//  NÃO REMOVE NENHUMA FUNÇÃO EXISTENTE
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
// 🔐 ACESSO ADMIN
// ============================================================
const ADMINS = [
  "6YczX4gLpUStlBVdQOXWc3uEYGG2",
  "LYu3M8gyRdMCqhE90vmH9Jh5Ksj1",
  "plSHKV043gTpEYfx7I3TI6FsJG93",
  "zIfbMxD1SQNvtlX9y6YUsEz2TXC3"
];

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

  carregarListaMotoboys();
  carregarSaldoGeralMotoboys();
  carregarSaldoFinanceiro(); // NOVO
  verificarEstoqueHoje();
  carregarCaixaHoje();
  calcularResumoDia();
});

// ============================================================
// 🚪 LOGOUT
// ============================================================
document.getElementById("logoutAdmin")?.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// ============================================================
// 📁 RELATÓRIOS
// ============================================================
document.getElementById("btnRelatorios")?.addEventListener("click", () => {
  window.location.href = "relatorios.html";
});

// ============================================================
// 🎨 CLASSE DE SALDO
// ============================================================
function getClasseSaldo(valor) {
  if (valor > 0) return "positivo";
  if (valor < 0) return "negativo";
  return "neutral";
}

// ============================================================
// 🛵 LISTA DE MOTOBOYS (INALTERADO)
// ============================================================
async function carregarListaMotoboys() {
  const listaEl = document.getElementById("listaMotoboys");
  listaEl.innerHTML = "<p>Carregando...</p>";

  const snap = await getDocs(collection(db, "motoboys"));

  let html = "";

  snap.forEach((d) => {
    const x = d.data();
    const saldo = Number(x.saldo || 0);

    html += `
      <div class="motoboy-item ${getClasseSaldo(saldo)}">
        <div>
          <strong>${x.nome}</strong><br>
          <span>R$ ${saldo.toFixed(2).replace(".", ",")}</span>
        </div>
        <button class="btnPagar"
          data-id="${d.id}"
          data-nome="${x.nome}">
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
// 💼 SALDO GERAL — APENAS MOTOBOYS (INALTERADO)
// ============================================================
async function carregarSaldoGeralMotoboys() {
  const snap = await getDocs(collection(db, "motoboys"));
  let total = 0;

  snap.forEach((d) => {
    total += Number(d.data().saldo || 0);
  });

  const el = document.getElementById("saldoGeral");
  if (!el) return;

  el.textContent = "R$ " + total.toFixed(2).replace(".", ",");
  el.className = "admin-value " + getClasseSaldo(total);
}

// ============================================================
// 💰 SALDO FINANCEIRO (PDV) — NOVO
// ============================================================
async function carregarSaldoFinanceiro() {
  let entradas = 0;
  let saidas = 0;

  // CAIXA DIÁRIO
  const snapCaixa = await getDocs(collection(db, "caixaDiario"));
  snapCaixa.forEach(d => {
    const x = d.data();
    if (x.tipo === "entrada") entradas += Number(x.valor || 0);
    else saidas += Number(x.valor || 0);
  });

  // DESPESAS (SEMPRE SAÍDA)
  const snapDespesas = await getDocs(collection(db, "despesas"));
  snapDespesas.forEach(d => {
    saidas += Number(d.data().valor || 0);
  });

  const saldo = entradas - saidas;

  const el = document.getElementById("saldoFinanceiro");
  if (!el) return;

  el.textContent = "R$ " + saldo.toFixed(2).replace(".", ",");
  el.className = "admin-value " + getClasseSaldo(saldo);
}

// ============================================================
// 💸 MODAL PAGAMENTO (INALTERADO)
// ============================================================
const modal = document.getElementById("modalPagamento");
const inputValorPagamento = document.getElementById("modalValorPagamento");
const confirmarPagamentoBtn = document.getElementById("confirmarPagamento");
const cancelarPagamentoBtn = document.getElementById("cancelarPagamento");
const modalNomeMotoboy = document.getElementById("modalNomeMotoboy");

let pagamentoMotoboyId = null;

function abrirModalPagamento(e) {
  pagamentoMotoboyId = e.currentTarget.dataset.id;
  modalNomeMotoboy.textContent = e.currentTarget.dataset.nome;
  modal.classList.remove("hidden");
}

cancelarPagamentoBtn?.addEventListener("click", () => {
  modal.classList.add("hidden");
  inputValorPagamento.value = "";
});

// ============================================================
// 💵 CONFIRMAR PAGAMENTO — LÓGICA CORRETA
// ============================================================
confirmarPagamentoBtn?.addEventListener("click", async () => {
  const valor = Number(inputValorPagamento.value);
  if (!valor || valor <= 0) {
    alert("Valor inválido.");
    return;
  }

  const ref = doc(db, "motoboys", pagamentoMotoboyId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const dados = snap.data();

  if (pagamentoMotoboyId === "lucas_hiago") {
    await updateDoc(ref, {
      saldo: Number(dados.saldo || 0) - valor
    });
  }

  await addDoc(collection(db, "despesas"), {
    descricao: `Pagamento motoboy - ${dados.nome}`,
    valor,
    data: new Date().toISOString().split("T")[0]
  });

  modal.classList.add("hidden");
  inputValorPagamento.value = "";

  carregarListaMotoboys();
  carregarSaldoGeralMotoboys();
  carregarSaldoFinanceiro();
});

// ============================================================
// 💸 CAIXA DIÁRIO (INALTERADO)
// ============================================================
document.getElementById("btnRegistrarCaixa")?.addEventListener("click", async () => {
  const tipo = caixaTipo.value;
  const categoria = caixaCategoria.value;
  const descricao = caixaDescricao.value.trim();
  const valor = Number(caixaValor.value);
  const data = caixaData.value;

  if (!descricao || !valor || !data) {
    alert("Preencha tudo.");
    return;
  }

  await addDoc(collection(db, "caixaDiario"), {
    tipo,
    categoria,
    descricao,
    valor,
    data,
    timestamp: Date.now()
  });

  carregarCaixaHoje();
  calcularResumoDia();
  carregarSaldoFinanceiro();
});

// ============================================================
// 📊 RESUMO DO DIA (INALTERADO)
// ============================================================
async function calcularResumoDia() {
  const hoje = new Date().toISOString().slice(0, 10);
  const snap = await getDocs(query(
    collection(db, "caixaDiario"),
    where("data", "==", hoje)
  ));

  let entradas = 0;
  let saidas = 0;

  snap.forEach(d => {
    const x = d.data();
    if (x.tipo === "entrada") entradas += Number(x.valor || 0);
    else saidas += Number(x.valor || 0);
  });

  document.getElementById("resumoEntradas").textContent = "R$ " + entradas.toFixed(2).replace(".", ",");
  document.getElementById("resumoSaidas").textContent = "R$ " + saidas.toFixed(2).replace(".", ",");
  document.getElementById("resumoSaldoDia").textContent =
    "R$ " + (entradas - saidas).toFixed(2).replace(".", ",");
}