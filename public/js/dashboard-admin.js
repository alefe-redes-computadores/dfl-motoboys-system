// =========================================================
//  DFL — DASHBOARD ADMIN (VERSÃO FINAL COMPLETA • CORRIGIDA)
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
  lucas_hiago: {
    nome: "Lucas Hiago",
    valorEntrega: 6 // fixo
  },
  rodrigo_goncalves: {
    nome: "Rodrigo Gonçalves",
    valorEntrega: 7, // após 10 entregas
    valorBase: 100 // até 10 entregas
  }
};

// =========================================================
//  LISTAR MOTOBOYS NO PAINEL + REGRA DE CORES
// =========================================================
async function carregarListaMotoboys() {
  const listaEl = document.getElementById("listaMotoboys");
  listaEl.innerHTML = "<p>Carregando...</p>";

  const snap = await getDocs(collection(db, "motoboys"));

  let html = "";

  snap.forEach((docu) => {
    const x = docu.data();

    const saldo = Number(x.saldo || 0);

    let classe = "neutral";

    if (saldo > 0) classe = "negativo";      // vermelho = você deve para o motoboy
    if (saldo < 0) classe = "positivo";      // verde = motoboy deve para você
    if (saldo === 0) classe = "neutral";     // branco = zerado

    html += `
      <div class="motoboy-item ${classe}">
        <strong>${x.nome}</strong>
        <span>R$ ${saldo.toFixed(2).replace(".", ",")}</span>
      </div>
    `;
  });

  listaEl.innerHTML = html;
}

// =========================================================
//  CALCULAR SALDO GERAL (mesma regra de cor)
// =========================================================
async function carregarSaldoGeral() {
  const snap = await getDocs(collection(db, "motoboys"));
  let total = 0;

  snap.forEach(d => total += Number(d.data().saldo || 0));

  const el = document.getElementById("saldoGeral");
  el.textContent = "R$ " + total.toFixed(2).replace(".", ",");

  if (total > 0) el.className = "admin-value negativo";
  else if (total < 0) el.className = "admin-value positivo";
  else el.className = "admin-value neutral";
}

// =========================================================
//  CATEGORIAS DE ESTOQUE
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

  outros_extra: [
    "Outro (Preencher manualmente)"
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
//  MOSTRAR BOTÃO PDF
// =========================================================
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

// =========================================================
//  PDF
// =========================================================
document.getElementById("btnGerarPdfEstoque").addEventListener("click", () => {
  window.location.href = "pdf-estoque.html";
});

// =========================================================
// 🔥 REGISTRAR DESPESA MANUAL
// =========================================================
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

  alert("Despesa registrada!");
});

// =========================================================
// 🔥 REGISTRAR ENTREGA + PAGAMENTO AUTOMÁTICO
// =========================================================

const selMotoboy = document.getElementById("entregaMotoboy");
const campoOutro = document.getElementById("grupoMotoboyOutro");

selMotoboy.addEventListener("change", () => {
  campoOutro.style.display = selMotoboy.value === "outro" ? "block" : "none";
});

document.getElementById("btnSalvarEntregaManual").addEventListener("click", async () => {

  const idMotoboy = selMotoboy.value;
  const nomeOutro = document.getElementById("entregaMotoboyOutro").value.trim();

  const qtdEntregas = Number(document.getElementById("entregaQtd").value);
  const valorManual = Number(document.getElementById("valorPagoMotoboy").value);
  const data = document.getElementById("entregaData").value;

  if (!qtdEntregas || !data) {
    alert("Preencha todos os campos obrigatórios.");
    return;
  }

  let nomeMotoboy = "";
  let valorPago = 0;

  // OUTRO MOTOBOY (valor definido manualmente)
  if (idMotoboy === "outro") {
    if (!nomeOutro) {
      alert("Digite o nome do motoboy.");
      return;
    }
    nomeMotoboy = nomeOutro;
    valorPago = valorManual;
  }

  // LUCAS HIAGO
  else if (idMotoboy === "lucas_hiago") {
    nomeMotoboy = "Lucas Hiago";
    valorPago = qtdEntregas * 6;
  }

  // RODRIGO GONÇALVES
  else if (idMotoboy === "rodrigo_goncalves") {
    nomeMotoboy = "Rodrigo Gonçalves";
    if (qtdEntregas <= 10) valorPago = 100;
    else valorPago = 100 + (qtdEntregas - 10) * 7;
  }

  // ============================================
  // SALVAR registro de entrega
  // ============================================
  await addDoc(collection(db, "entregasManuais"), {
    motoboy: idMotoboy,
    nomeMotoboy,
    quantidade: qtdEntregas,
    valorPago,
    data
  });

  // ============================================
  // ATUALIZAR SALDO DO MOTOBOY
  // ============================================
  const ref = doc(db, "motoboys", idMotoboy);

  const snap = await getDoc(ref);
  let saldoAtual = snap.exists() ? Number(snap.data().saldo || 0) : 0;

  saldoAtual += valorPago;

  await setDoc(ref, {
    nome: nomeMotoboy,
    saldo: saldoAtual
  }, { merge: true });

  // ============================================
  // REGISTRAR como DESPESA
  // ============================================
  await addDoc(collection(db, "despesas"), {
    descricao: `Pagamento motoboy — ${nomeMotoboy}`,
    valor: Number(valorPago),
    data
  });

  alert("Entrega registrada com sucesso!");

  carregarListaMotoboys();
  carregarSaldoGeral();
});