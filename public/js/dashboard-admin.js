// =========================================================
//  DFL — DASHBOARD ADMIN (VERSÃO FINAL ESTÁVEL 2025)
// =========================================================

import { auth, db } from "./firebase-config-v2.js";

import {
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  addDoc,
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// =========================================================
//  ACESSO APENAS ADMIN
// =========================================================
const ADMINS = [
  "6YczX4gLpUStlBVdQOXWc3uEYGG2",
  "LYu3M8gyRdMCqhE90vmH9Jh5Ksj1",
  "plSHKV043gTpEYfx7I3TI6FsJG93",
  "zIfbMxD1SQNvtlX9y6YUsEz2TXC3"
];

onAuthStateChanged(auth, async (user) => {
  if (!user) return (window.location.href = "index.html");
  if (!ADMINS.includes(user.uid)) {
    alert("Acesso restrito.");
    return (window.location.href = "dashboard.html");
  }

  carregarListaMotoboys();
  carregarSaldoGeral();
  verificarEstoqueHoje();
});

// =========================================================
//  LOGOUT
// =========================================================
document.getElementById("logoutAdmin")?.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// =========================================================
//  BOTÃO RELATÓRIOS
// =========================================================
document.getElementById("btnRelatorios")?.addEventListener("click", () => {
  window.location.href = "relatorios.html";
});

// =========================================================
//  FUNÇÃO DE COR DO SALDO
// =========================================================
function getClasseSaldo(saldo) {
  if (saldo > 0) return "negativo";
  if (saldo < 0) return "positivo";
  return "neutral";
}

// =========================================================
//  LISTAR MOTOBOYS — LAYOUT CORRETO (NOME EM CIMA, SALDO EMBAIXO)
// =========================================================
async function carregarListaMotoboys() {
  const listaEl = document.getElementById("listaMotoboys");
  listaEl.innerHTML = "<p>Carregando...</p>";

  const snap = await getDocs(collection(db, "motoboys"));

  let html = "";
  snap.forEach((d) => {
    const x = d.data();
    const saldo = Number(x.saldo || 0);
    const classe = getClasseSaldo(saldo);

    html += `
      <div class="motoboy-item ${classe}">
        <div class="motoboy-info">
          <strong>${x.nome}</strong>
          <span class="motoboy-saldo">R$ ${saldo.toFixed(2).replace(".", ",")}</span>
        </div>

        <button class="btnPagar" data-id="${d.id}" data-nome="${x.nome}" data-saldo="${saldo}">
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

// =========================================================
//  SALDO GERAL
// =========================================================
async function carregarSaldoGeral() {
  const snap = await getDocs(collection(db, "motoboys"));
  let total = 0;

  snap.forEach((d) => total += Number(d.data().saldo || 0));

  const el = document.getElementById("saldoGeral");
  el.textContent = "R$ " + total.toFixed(2).replace(".", ",");

  el.className = "admin-value " + getClasseSaldo(total);
}

// =========================================================
//  ITENS DO ESTOQUE
// =========================================================
const SUBITENS = {
  frios: [
    "Bacon",
    "Carne Moída/Artesanais",
    "Cheddar",
    "Filé de Frango",
    "Hambúrguer",
    "Mussarela",
    "Presunto",
    "Salsicha"
  ],
  refrigerantes: [
    "Coca 200ml",
    "Coca 310ml",
    "Coca 310ml Zero",
    "Coca 1L",
    "Coca 1L Zero",
    "Coca 2L",
    "Del Valle 450ml Uva",
    "Del Valle 450ml Laranja",
    "Fanta 1L",
    "Kuat 2L"
  ],
  embalagens: [
    "Bobina",
    "Dogueira",
    "Hamburgueira",
    "Papel Kraft",
    "Saco Plástico",
    "Sacola 30x40",
    "Sacola 38x48"
  ],
  paes: ["Pão Hambúrguer", "Pão Hot Dog"],
  hortifruti: [
    "Alface",
    "Batata Palha",
    "Cebola",
    "Cebolinha",
    "Milho",
    "Óleo",
    "Ovo",
    "Tomate"
  ],
  outros_extra: ["Outro (Preencher manualmente)"]
};

const categoriaSel = document.getElementById("estoqueCategoria");
const itemSel = document.getElementById("estoqueItem");

function atualizarItens() {
  const lista = SUBITENS[categoriaSel.value] || [];
  itemSel.innerHTML = lista.sort().map(i => `<option value="${i}">${i}</option>`).join("");
}
categoriaSel.addEventListener("change", atualizarItens);
atualizarItens();

// =========================================================
//  REGISTRAR ESTOQUE
// =========================================================
document.getElementById("btnSalvarEstoque").addEventListener("click", async () => {
  const item = itemSel.value;
  const categoria = categoriaSel.value;
  const quantidade = document.getElementById("estoqueQtd").value;
  const data = document.getElementById("estoqueData").value;

  if (!item || !categoria || !quantidade || !data)
    return alert("Preencha tudo.");

  await addDoc(collection(db, "estoqueDia"), {
    item,
    categoria,
    quantidade,
    data
  });

  alert("Estoque salvo!");
  verificarEstoqueHoje();
});

// =========================================================
//  MOSTRAR BOTÃO PDF
// =========================================================
async function verificarEstoqueHoje() {
  const hoje = new Date().toISOString().slice(0, 10);

  const q = query(collection(db, "estoqueDia"), where("data", "==", hoje));
  const snap = await getDocs(q);

  document.getElementById("btnGerarPdfEstoque").style.display =
    snap.size > 0 ? "block" : "none";
}

// =========================================================
//  ABRIR PDF
// =========================================================
document.getElementById("btnGerarPdfEstoque").addEventListener("click", () => {
  window.location.href = "pdf-estoque.html";
});

// =========================================================
//  DESPESAS
// =========================================================
document.getElementById("btnSalvarDespesa").addEventListener("click", async () => {
  const desc = document.getElementById("descDespesa").value;
  const valor = Number(document.getElementById("valorDespesa").value);
  const data = document.getElementById("dataDespesa").value;

  if (!desc || !valor || !data) return alert("Preencha tudo.");

  await addDoc(collection(db, "despesas"), { descricao: desc, valor, data });

  alert("Despesa registrada!");
});

// =========================================================
//  MODAL PAGAMENTO
// =========================================================
const modal = document.getElementById("modalPagamento");
const inputValorPagamento = document.getElementById("modalValorPagamento");
const confirmarPagamentoBtn = document.getElementById("confirmarPagamento");
const cancelarPagamentoBtn = document.getElementById("cancelarPagamento");

let pagamentoMotoboyId = null;

function abrirModalPagamento(e) {
  pagamentoMotoboyId = e.target.dataset.id;
  modal.classList.remove("hidden");
}

cancelarPagamentoBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
  pagamentoMotoboyId = null;
  inputValorPagamento.value = "";
});

// =========================================================
//  CONFIRMAR PAGAMENTO
// =========================================================
confirmarPagamentoBtn.addEventListener("click", async () => {
  const valor = Number(inputValorPagamento.value);

  if (!valor || valor <= 0) return alert("Valor inválido.");

  const ref = doc(db, "motoboys", pagamentoMotoboyId);
  const snap = await getDoc(ref);

  let saldoAtual = snap.exists() ? Number(snap.data().saldo || 0) : 0;

  saldoAtual -= valor;

  await updateDoc(ref, { saldo: saldoAtual });

  await addDoc(collection(db, "despesas"), {
    descricao: `Pagamento motoboy`,
    valor,
    data: new Date().toISOString().slice(0, 10)
  });

  modal.classList.add("hidden");
  inputValorPagamento.value = "";

  carregarListaMotoboys();
  carregarSaldoGeral();

  alert("Pagamento registrado!");
});

// =========================================================
//  REGISTRAR ENTREGA MANUAL
// =========================================================
document.getElementById("btnSalvarEntregaManual").addEventListener("click", async () => {
  const idMotoboy = document.getElementById("entregaMotoboy").value;
  const qtd = Number(document.getElementById("entregaQtd").value);
  const valorManual = Number(document.getElementById("valorPagoMotoboy").value);
  const data = document.getElementById("entregaData").value;
  const nomeOutro = document.getElementById("entregaMotoboyOutro").value.trim();

  if (!qtd || !data) return alert("Preencha tudo.");

  let nomeMotoboy = "";
  let valorPago = 0;

  if (idMotoboy === "outro") {
    nomeMotoboy = nomeOutro;
    valorPago = valorManual;
  }

  else if (idMotoboy === "lucas_hiago") {
    nomeMotoboy = "Lucas Hiago";
    valorPago = qtd * 6;
  }

  else if (idMotoboy === "rodrigo_goncalves") {
    nomeMotoboy = "Rodrigo Gonçalves";
    valorPago = 0;
  }

  await addDoc(collection(db, "entregasManuais"), {
    nomeMotoboy,
    motoboy: idMotoboy,
    quantidade: qtd,
    valorPago,
    data
  });

  alert("Entrega registrada!");

  carregarListaMotoboys();
  carregarSaldoGeral();
});