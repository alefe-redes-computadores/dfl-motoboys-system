// =========================================
//  DFL — DASHBOARD ADMIN (VERSÃO FINAL)
// =========================================

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
  where
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// UID dos administradores
const ADMINS = [
  "6YczX4gLpUStlBVdQOXWc3uEYGG2",
  "LYu3M8gyRdMCqhE90vmH9Jh5Ksj1",
  "plSHKV043gTpEYfx7I3TI6FsJG93",
  "zIfbMxD1SQNvtlX9y6YUsEz2TXC3"
];

// =======================
// VERIFICA LOGIN
// =======================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  if (!ADMINS.includes(user.uid)) {
    alert("Acesso restrito a administradores.");
    window.location.href = "dashboard.html";
    return;
  }

  carregarSaldoMotoboy();
  verificarEstoqueHoje();
});

// =======================
// LOGOUT
// =======================
document.getElementById("logoutAdmin")?.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// =======================
// SALDO DO MOTOBOY + GERAL
// =======================
async function carregarSaldoMotoboy() {
  const saldoLucasEl = document.getElementById("saldo_lucas_hiago");
  const saldoGeralEl = document.getElementById("saldoGeral");

  const snap = await getDoc(doc(db, "motoboys", "lucas_hiago"));
  let saldo = 0;

  if (snap.exists()) {
    saldo = Number(snap.data().saldo || 0);
  }

  saldoLucasEl.textContent = "R$ " + saldo.toFixed(2).replace(".", ",");
  saldoLucasEl.className = "motoboy-saldo " + (saldo > 0 ? "negativo" : "positivo");

  const snapAll = await getDocs(collection(db, "motoboys"));
  let total = 0;
  snapAll.forEach(d => total += Number(d.data().saldo || 0));

  saldoGeralEl.textContent = "R$ " + total.toFixed(2).replace(".", ",");
  saldoGeralEl.className = total > 0 ? "admin-value negativo" : "admin-value positivo";
}

// =======================
// CATEGORIAS + SUBITENS
// =======================
const SUBITENS = {
  frios: [
    "Bacon", "Carne Moída/Artesanais", "Cheddar",
    "Filé de Frango", "Hambúrguer", "Mussarela",
    "Presunto", "Salsicha"
  ],

  refrigerantes: [
    "Coca 200ml", "Coca 310ml", "Coca 310ml Zero",
    "Coca 1L", "Coca 1L Zero", "Coca 2L",
    "Del Valle 450ml Uva", "Del Valle 450ml Laranja",
    "Fanta 1L", "Kuat 2L"
  ],

  embalagens: [
    "Bobina", "Dogueira", "Hamburgueira",
    "Papel Kraft", "Saco Plástico",
    "Sacola 30x40", "Sacola 38x48"
  ],

  paes: [
    "Pão Hambúrguer", "Pão Hot Dog"
  ],

  outros: [
    "Alface", "Batata Palha", "Cebola",
    "Cebolinha", "Milho", "Óleo", "Ovo", "Tomate"
  ]
};

const categoriaSel = document.getElementById("estoqueCategoria");
const itemSel = document.getElementById("estoqueItem");

function atualizarItens() {
  const cat = categoriaSel.value;
  const itens = SUBITENS[cat] || [];

  itemSel.innerHTML = itens
    .sort()
    .map(i => `<option value="${i}">${i}</option>`)
    .join("");
}

categoriaSel.addEventListener("change", atualizarItens);
atualizarItens();

// =======================
// SALVAR ESTOQUE
// =======================
document.getElementById("btnSalvarEstoque").addEventListener("click", async () => {
  const categoria = categoriaSel.value;
  const item = itemSel.value;
  const qtd = document.getElementById("estoqueQtd").value;
  const data = document.getElementById("estoqueData").value;

  if (!categoria || !item || !qtd || !data) {
    alert("Preencha todos os campos.");
    return;
  }

  await addDoc(collection(db, "estoqueDia"), {
    categoria,
    item,
    quantidade: qtd,
    data
  });

  alert("Estoque salvo!");
  verificarEstoqueHoje();
});

// =======================
// MOSTRAR BOTÃO PDF SE EXISTIR ESTOQUE NO DIA
// =======================
async function verificarEstoqueHoje() {
  const hoje = new Date().toISOString().slice(0, 10);

  const q = query(
    collection(db, "estoqueDia"),
    where("data", "==", hoje)
  );

  const snap = await getDocs(q);

  const btn = document.getElementById("btnGerarPdfEstoque");
  btn.style.display = snap.size > 0 ? "block" : "none";
}

// =======================
// ABRIR PÁGINA DO PDF
// =======================
document.getElementById("btnGerarPdfEstoque").addEventListener("click", () => {
  window.location.href = "pdf-estoque.html";
});

// =======================
// SALVAR DESPESA
// =======================
document.getElementById("btnSalvarDespesa").addEventListener("click", async () => {
  const desc = document.getElementById("descDespesa").value;
  const valor = document.getElementById("valorDespesa").value;
  const data = document.getElementById("dataDespesa").value;

  if (!desc || !valor || !data) {
    alert("Preencha todos os campos.");
    return;
  }

  await addDoc(collection(db, "despesas"), {
    descricao: desc,
    valor: Number(valor),
    data
  });

  alert("Despesa salva!");
});

// =======================
// ENTREGAS MANUAIS
// =======================
document.getElementById("btnSalvarEntregaManual").addEventListener("click", async () => {
  const motoboy = document.getElementById("entregaMotoboy").value;
  const qtd = Number(document.getElementById("entregaQtd").value);
  const data = document.getElementById("entregaData").value;

  if (!motoboy || !qtd || !data) {
    alert("Preencha todos os campos.");
    return;
  }

  await addDoc(collection(db, "entregasManuais"), {
    motoboy,
    quantidade: qtd,
    data
  });

  const ref = doc(db, "motoboys", motoboy);
  const snap = await getDoc(ref);

  let saldoAtual = snap.exists() ? Number(snap.data().saldo || 0) : 0;
  saldoAtual += qtd * 2;

  await updateDoc(ref, { saldo: saldoAtual });

  alert("Entrega registrada!");
  carregarSaldoMotoboy();
});