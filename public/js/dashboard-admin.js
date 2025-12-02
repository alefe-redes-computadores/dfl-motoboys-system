// =========================================================
//  DFL — DASHBOARD ADMIN (VERSÃO FINAL COMPLETA)
//  - Botão PAGAR alinhado ✔
//  - Modal funcionando ✔
//  - Saldo modo 2 (saldo += pagamento) ✔
//  - Lista motoboys + cores ✔
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
  where,
  orderBy
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
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  if (!ADMINS.includes(user.uid)) {
    alert("Acesso restrito a administradores.");
    window.location.href = "dashboard.html";
    return;
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
// 🔥 MOTOBOYS FIXOS DO SISTEMA
// =========================================================
const MOTOS_FIXOS = {
  lucas_hiago: { nome: "Lucas Hiago", valorEntrega: 6 },
  rodrigo_goncalves: { nome: "Rodrigo Gonçalves", valorEntrega: 7, valorBase: 100 }
};

// =========================================================
//  LISTAR MOTOBOYS + COR + BOTÃO PAGAR
// =========================================================
async function carregarListaMotoboys() {
  const listaEl = document.getElementById("listaMotoboys");
  listaEl.innerHTML = "<p>Carregando motoboys...</p>";

  const snap = await getDocs(collection(db, "motoboys"));

  let html = "";

  snap.forEach((docu) => {
    const x = docu.data();
    const saldo = Number(x.saldo || 0);

    let classe = "neutral";
    if (saldo > 0) classe = "negativo";  // vermelho (você deve para o motoboy)
    if (saldo < 0) classe = "positivo";  // verde (motoboy deve para você)

    html += `
      <div class="motoboy-item ${classe}">
        <strong>${x.nome}</strong>
        <span>R$ ${saldo.toFixed(2).replace(".", ",")}</span>
        <button class="btn-pagar" data-id="${docu.id}" data-nome="${x.nome}">
          Pagar
        </button>
      </div>
    `;
  });

  listaEl.innerHTML = html;

  document.querySelectorAll(".btn-pagar").forEach(btn => {
    btn.addEventListener("click", abrirModalPagamento);
  });
}

// =========================================================
//  MODAL PAGAMENTO
// =========================================================
const modal = document.getElementById("modalPagamento");
const modalNome = document.getElementById("modalNomeMotoboy");
const modalValor = document.getElementById("modalValorPagamento");

let motoboyAtual = null;

function abrirModalPagamento(e) {
  motoboyAtual = {
    id: e.target.dataset.id,
    nome: e.target.dataset.nome
  };

  modalNome.textContent = motoboyAtual.nome;
  modal.style.display = "flex";
}

document.getElementById("cancelarPagamento").addEventListener("click", () => {
  modal.style.display = "none";
  modalValor.value = "";
});

// =========================================================
//  CONFIRMAR PAGAMENTO (modo 2 — soma tudo)
// =========================================================
document.getElementById("confirmarPagamento").addEventListener("click", async () => {
  const valorPago = Number(modalValor.value);

  if (!valorPago || valorPago <= 0) {
    alert("Digite um valor válido.");
    return;
  }

  const ref = doc(db, "motoboys", motoboyAtual.id);
  const snap = await getDoc(ref);

  const saldoAtual = snap.exists() ? Number(snap.data().saldo || 0) : 0;

  // 🔥 MODO 2: saldo += pagamento
  const novoSaldo = saldoAtual + valorPago;

  await updateDoc(ref, { saldo: novoSaldo });

  // Registrar como despesa
  await addDoc(collection(db, "despesas"), {
    descricao: `Pagamento motoboy — ${motoboyAtual.nome}`,
    valor: valorPago,
    data: new Date().toISOString().slice(0, 10)
  });

  modal.style.display = "none";
  modalValor.value = "";

  carregarListaMotoboys();
  carregarSaldoGeral();

  alert("Pagamento registrado!");
});

// =========================================================
//  ESTOQUE — CATEGORIAS
// =========================================================
const SUBITENS = {
  frios: ["Bacon", "Carne Moída/Artesanais", "Cheddar", "Filé de Frango", "Hambúrguer", "Mussarela", "Presunto", "Salsicha"],
  refrigerantes: ["Coca 200ml","Coca 310ml","Coca 310ml Zero","Coca 1L","Coca 1L Zero","Coca 2L","Del Valle 450ml Uva","Del Valle 450ml Laranja","Fanta 1L","Kuat 2L"],
  embalagens: ["Bobina","Dogueira","Hamburgueira","Papel Kraft","Saco Plástico","Sacola 30x40","Sacola 38x48"],
  paes: ["Pão Hambúrguer","Pão Hot Dog"],
  hortifruti: ["Alface","Batata Palha","Cebola","Cebolinha","Milho","Óleo","Ovo","Tomate"],
  outros_extra: ["Outro (Preencher manualmente)"]
};

const categoriaSel = document.getElementById("estoqueCategoria");
const itemSel = document.getElementById("estoqueItem");

function atualizarItens() {
  const itens = SUBITENS[categoriaSel.value] || [];
  itemSel.innerHTML = itens.map(i => `<option value="${i}">${i}</option>`).join("");
}

categoriaSel.addEventListener("change", atualizarItens);
atualizarItens();

// =========================================================
//  SALVAR ESTOQUE
// =========================================================
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

// =========================================================
//  MOSTRAR / ESCONDER BOTÃO PDF
// =========================================================
async function verificarEstoqueHoje() {
  const hoje = new Date().toISOString().slice(0, 10);

  const q = query(collection(db, "estoqueDia"), where("data", "==", hoje));
  const snap = await getDocs(q);

  document.getElementById("btnGerarPdfEstoque").style.display =
    snap.size > 0 ? "block" : "none";
}

// =========================================================
//  PDF
// =========================================================
document.getElementById("btnGerarPdfEstoque").addEventListener("click", () => {
  window.location.href = "pdf-estoque.html";
});

// =========================================================
//  REGISTRAR DESPESA MANUAL
// =========================================================
document.getElementById("btnSalvarDespesa").addEventListener("click", async () => {
  const desc = document.getElementById("descDespesa").value;
  const valor = Number(document.getElementById("valorDespesa").value);
  const data = document.getElementById("dataDespesa").value;

  if (!desc || !valor || !data) {
    alert("Preencha todos os campos.");
    return;
  }

  await addDoc(collection(db, "despesas"), {
    descricao: desc,
    valor,
    data
  });

  alert("Despesa registrada!");
});