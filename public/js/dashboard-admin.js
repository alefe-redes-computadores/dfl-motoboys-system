/* =========================================================
   DFL — DASHBOARD ADMIN (VERSÃO FINAL • ESTÁVEL)
   Agora com:
   ✔ Botão PAGAR funcionando
   ✔ Modal funcional
   ✔ Cores corretas (negativo/vermelho, positivo/verde, zerado/branco)
   ✔ Alinhamento perfeito
   ✔ Rodrigo corrigido
   ✔ Evita bugs de estado
========================================================= */

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

/* =========================================================
   ACESSO APENAS ADMIN
========================================================= */
const ADMINS = [
  "6YczX4gLpUStlBVdQOXWc3uEYGG2",
  "LYu3M8gyRdMCqhE90vmH9Jh5Ksj1",
  "plSHKV043gTpEYfx7I3TI6FsJG93",
  "zIfbMxD1SQNvtlX9y6YUsEz2TXC3"
];

onAuthStateChanged(auth, (user) => {
  if (!user) return (window.location.href = "index.html");

  if (!ADMINS.includes(user.uid)) {
    alert("Acesso restrito a administradores.");
    return (window.location.href = "dashboard.html");
  }

  carregarListaMotoboys();
  carregarSaldoGeral();
  verificarEstoqueHoje();
});

/* =========================================================
   LOGOUT
========================================================= */
document.getElementById("logoutAdmin")?.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

/* =========================================================
   BOTÃO RELATÓRIOS
========================================================= */
document.getElementById("btnRelatorios")?.addEventListener("click", () => {
  window.location.href = "relatorios.html";
});

/* =========================================================
   MOTOBOYS FIXOS
========================================================= */
const MOTOBOYS_FIXOS = {
  lucas_hiago: { nome: "Lucas Hiago" },
  rodrigo_goncalves: { nome: "Rodrigo Gonçalves" }
};

/* =========================================================
   LISTAR MOTOBOYS NO PAINEL (COM BOTÃO PAGAR)
========================================================= */
async function carregarListaMotoboys() {
  const lista = document.getElementById("listaMotoboys");
  lista.innerHTML = "<p>Carregando...</p>";

  const snap = await getDocs(collection(db, "motoboys"));
  let html = "";

  snap.forEach((m) => {
    const data = m.data();
    const saldo = Number(data.saldo || 0);

    let classe = "neutral";
    if (saldo > 0) classe = "negativo";   // você deve para o motoboy
    if (saldo < 0) classe = "positivo";   // motoboy deve para você

    html += `
      <div class="motoboy-item ${classe}">
        <div class="motoboy-left">
          <span class="motoboy-nome">${data.nome}</span>
          <span class="motoboy-saldo">R$ ${saldo.toFixed(2).replace(".", ",")}</span>
        </div>

        <button class="btn-pagar" data-id="${m.id}" data-nome="${data.nome}" data-saldo="${saldo}">
          Pagar
        </button>
      </div>
    `;
  });

  lista.innerHTML = html;

  document.querySelectorAll(".btn-pagar").forEach(btn => {
    btn.addEventListener("click", abrirModalPagamento);
  });
}

/* =========================================================
   SALDO GERAL
========================================================= */
async function carregarSaldoGeral() {
  const snap = await getDocs(collection(db, "motoboys"));
  let total = 0;

  snap.forEach((m) => {
    total += Number(m.data().saldo || 0);
  });

  const el = document.getElementById("saldoGeral");
  el.textContent = "R$ " + total.toFixed(2).replace(".", ",");

  if (total > 0) el.className = "admin-value negativo";
  else if (total < 0) el.className = "admin-value positivo";
  else el.className = "admin-value neutral";
}

/* =========================================================
   ESTOQUE — DROPDOWN DE ITENS
========================================================= */
const SUBITENS = {
  frios: [
    "Bacon", "Carne Moída/Artesanais", "Cheddar", "Filé de Frango",
    "Hambúrguer", "Mussarela", "Presunto", "Salsicha"
  ],
  refrigerantes: [
    "Coca 200ml","Coca 310ml","Coca 310ml Zero","Coca 1L","Coca 1L Zero",
    "Coca 2L","Del Valle 450ml Uva","Del Valle 450ml Laranja","Fanta 1L","Kuat 2L"
  ],
  embalagens: [
    "Bobina","Dogueira","Hamburgueira","Papel Kraft",
    "Saco Plástico","Sacola 30x40","Sacola 38x48"
  ],
  paes: ["Pão Hambúrguer", "Pão Hot Dog"],
  hortifruti: [
    "Alface","Batata Palha","Cebola","Cebolinha",
    "Milho","Óleo","Ovo","Tomate"
  ],
  outros_extra: ["Outro (Preencher manualmente)"]
};

const selCategoria = document.getElementById("estoqueCategoria");
const selItem = document.getElementById("estoqueItem");

function atualizarItens() {
  const itens = SUBITENS[selCategoria.value] || [];
  selItem.innerHTML = itens.sort().map(i => `<option value="${i}">${i}</option>`).join("");
}
selCategoria.addEventListener("change", atualizarItens);
atualizarItens();

/* =========================================================
   SALVAR ESTOQUE
========================================================= */
document.getElementById("btnSalvarEstoque").addEventListener("click", async () => {
  const categoria = selCategoria.value;
  const item = selItem.value;
  const qtd = document.getElementById("estoqueQtd").value;
  const data = document.getElementById("estoqueData").value;

  if (!categoria || !item || !qtd || !data)
    return alert("Preencha todos os campos.");

  await addDoc(collection(db, "estoqueDia"), {
    categoria,
    item,
    quantidade: qtd,
    data
  });

  alert("Estoque salvo!");
  verificarEstoqueHoje();
});

/* =========================================================
   MOSTRAR/ESCONDER BOTÃO PDF
========================================================= */
async function verificarEstoqueHoje() {
  const hoje = new Date().toISOString().slice(0, 10);

  const q = query(
    collection(db, "estoqueDia"),
    where("data", "==", hoje)
  );

  const snap = await getDocs(q);
  document.getElementById("btnGerarPdfEstoque").style.display =
    snap.size > 0 ? "block" : "none";
}

document.getElementById("btnGerarPdfEstoque").addEventListener("click", () => {
  window.location.href = "pdf-estoque.html";
});

/* =========================================================
   DESPESAS MANUAIS
========================================================= */
document.getElementById("btnSalvarDespesa").addEventListener("click", async () => {
  const desc = document.getElementById("descDespesa").value;
  const valor = Number(document.getElementById("valorDespesa").value);
  const data = document.getElementById("dataDespesa").value;

  if (!desc || !valor || !data) return alert("Preencha todos os campos.");

  await addDoc(collection(db, "despesas"), {
    descricao: desc,
    valor,
    data
  });

  alert("Despesa registrada!");
});

/* =========================================================
   🔥 MODAL DE PAGAMENTO
========================================================= */
let motoboySelecionado = null;

function abrirModalPagamento(e) {
  const id = e.target.dataset.id;
  const nome = e.target.dataset.nome;
  const saldo = Number(e.target.dataset.saldo);

  motoboySelecionado = { id, nome, saldo };

  document.getElementById("modalNomeMotoboy").textContent =
    `Motoboy: ${nome} — Saldo atual: R$ ${saldo.toFixed(2).replace(".", ",")}`;

  document.getElementById("modalPagamento").style.display = "flex";
}

document.getElementById("cancelarPagamento").addEventListener("click", () => {
  document.getElementById("modalPagamento").style.display = "none";
});

/* =========================================================
   CONFIRMAR PAGAMENTO
========================================================= */
document.getElementById("confirmarPagamento").addEventListener("click", async () => {

  const valor = Number(document.getElementById("modalValorPagamento").value);

  if (!valor || valor <= 0) return alert("Digite um valor válido.");

  const ref = doc(db, "motoboys", motoboySelecionado.id);

  const novoSaldo = motoboySelecionado.saldo - valor;

  await updateDoc(ref, { saldo: novoSaldo });

  await addDoc(collection(db, "despesas"), {
    descricao: `Pagamento ao motoboy — ${motoboySelecionado.nome}`,
    valor,
    data: new Date().toISOString().slice(0, 10)
  });

  alert("Pagamento registrado!");

  document.getElementById("modalPagamento").style.display = "none";
  document.getElementById("modalValorPagamento").value = "";

  carregarListaMotoboys();
  carregarSaldoGeral();
});