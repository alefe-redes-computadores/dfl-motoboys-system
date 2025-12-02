// ==============================================
//   DFL — DASHBOARD ADMIN (versão atualizada)
// ==============================================

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
  setDoc
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// ADMINISTRADORES
const ADMINS = [
  "6YczX4gLpUStlBVdQOXWc3uEYGG2",
  "LYu3M8gyRdMCqhE90vmH9Jh5Ksj1",
  "plSHKV043gTpEYfx7I3TI6FsJG93",
  "zIfbMxD1SQNvtlX9y6YUsEz2TXC3"
];

// LISTA DE MOTOBOYS FIXOS DO SISTEMA
const MOTOBOYS_FIXOS = {
  lucas_hiago: "Lucas Hiago",
  rodrigo_goncalves: "Rodrigo Gonçalves"
};

// ====================================================
// VERIFICA LOGIN
// ====================================================
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

// ====================================================
// LOGOUT
// ====================================================
document.getElementById("logoutAdmin")?.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// ====================================================
// BOTÃO RELATÓRIOS
// ====================================================
document.getElementById("btnRelatorios")?.addEventListener("click", () => {
  window.location.href = "relatorios.html";
});


// ====================================================
// 🔄 LISTA DE MOTOBOYS NO PAINEL
// ====================================================
async function carregarListaMotoboys() {
  const container = document.getElementById("listaMotoboys");
  container.innerHTML = "<p>Carregando...</p>";

  const snap = await getDocs(collection(db, "motoboys"));
  if (snap.empty) {
    container.innerHTML = "<p>Nenhum motoboy cadastrado.</p>";
    return;
  }

  let motoboys = [];

  snap.forEach((doc) => {
    motoboys.push({
      id: doc.id,
      nome: MOTOBOYS_FIXOS[doc.id] || doc.id,
      saldo: Number(doc.data().saldo || 0)
    });
  });

  // Ordena: quem tem saldo negativo primeiro
  motoboys.sort((a, b) => a.saldo - b.saldo);

  container.innerHTML = "";
  motoboys.forEach((m) => {
    const classe =
      m.saldo < 0
        ? "negativo"
        : m.saldo > 0
        ? "positivo"
        : "neutral";

    const el = document.createElement("div");
    el.className = "motoboy-item";
    el.innerHTML = `
      <span class="motoboy-nome">${m.nome}</span>
      <span class="motoboy-saldo ${classe}">R$ ${m.saldo
        .toFixed(2)
        .replace(".", ",")}</span>
    `;
    container.appendChild(el);
  });
}


// ====================================================
// SALDO GERAL
// ====================================================
async function carregarSaldoGeral() {
  const snap = await getDocs(collection(db, "motoboys"));
  let total = 0;

  snap.forEach((d) => {
    total += Number(d.data().saldo || 0);
  });

  const saldoGeralEl = document.getElementById("saldoGeral");
  saldoGeralEl.textContent = "R$ " + total.toFixed(2).replace(".", ",");
  saldoGeralEl.className =
    total < 0 ? "admin-value negativo" : "admin-value positivo";
}


// ====================================================
// ITENS DE ESTOQUE
// ====================================================
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

  paes: ["Pão Hambúrguer", "Pão Hot Dog"],

  hortifruti: [
    "Alface", "Batata Palha", "Cebola", "Cebolinha",
    "Milho", "Óleo", "Ovo", "Tomate"
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
    .map((i) => `<option value="${i}">${i}</option>`)
    .join("");
}

categoriaSel.addEventListener("change", atualizarItens);
atualizarItens();


// ====================================================
// SALVAR ESTOQUE
// ====================================================
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


// ====================================================
// BOTÃO PDF ESTOQUE
// ====================================================
async function verificarEstoqueHoje() {
  const hoje = new Date().toISOString().slice(0, 10);

  const q = query(collection(db, "estoqueDia"), where("data", "==", hoje));
  const snap = await getDocs(q);

  const btn = document.getElementById("btnGerarPdfEstoque");
  btn.style.display = snap.size > 0 ? "block" : "none";
}

document.getElementById("btnGerarPdfEstoque").addEventListener("click", () => {
  window.location.href = "pdf-estoque.html";
});


// ====================================================
// SALVAR DESPESA MANUAL
// ====================================================
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


// ====================================================
// REGISTRAR ENTREGA + PAGAMENTO AUTOMÁTICO
// ====================================================
document.getElementById("entregaMotoboy").addEventListener("change", () => {
  const sel = document.getElementById("entregaMotoboy").value;
  document.getElementById("grupoMotoboyOutro").style.display =
    sel === "outro" ? "block" : "none";
});

document.getElementById("btnSalvarEntregaManual").addEventListener("click", async () => {
  const motoboySel = document.getElementById("entregaMotoboy").value;
  const nomeOutro = document.getElementById("entregaMotoboyOutro").value;
  const qtd = Number(document.getElementById("entregaQtd").value);
  const valorManual = Number(document.getElementById("valorPagoMotoboy").value);
  const data = document.getElementById("entregaData").value;

  if (!qtd || !data) {
    alert("Preencha todos os campos obrigatórios.");
    return;
  }

  // ============================
  // IDENTIFICA O MOTOBOY
  // ============================
  let motoboyId = motoboySel;
  let nomeMotoboy = MOTOBOYS_FIXOS[motoboySel];

  if (motoboySel === "outro") {
    if (!nomeOutro) {
      alert("Digite o nome do motoboy.");
      return;
    }
    motoboyId = nomeOutro.toLowerCase().replace(/\s+/g, "_");
    nomeMotoboy = nomeOutro;
  }

  // ============================
  // CALCULA O PAGAMENTO
  // ============================
  let valorPagar = 0;

  if (motoboySel === "lucas_hiago") {
    valorPagar = qtd * 6;
  } else if (motoboySel === "rodrigo_goncalves") {
    if (qtd <= 10) valorPagar = 100;
    else valorPagar = 100 + (qtd - 10) * 7;
  } else {
    valorPagar = valorManual;
  }

  // ============================
  // REGISTRA ENTREGA
  // ============================
  await addDoc(collection(db, "entregasManuais"), {
    motoboy: nomeMotoboy,
    quantidade: qtd,
    valorPago: valorPagar,
    data
  });

  // ============================
  // REGISTRA DESPESA AUTOMÁTICA
  // ============================
  await addDoc(collection(db, "despesas"), {
    descricao: `Pagamento p/ motoboy: ${nomeMotoboy}`,
    valor: Number(valorPagar),
    data
  });

  // ============================
  // ATUALIZA SALDO DO MOTOBOY
  // ============================
  const ref = doc(db, "motoboys", motoboyId);
  const snap = await getDoc(ref);

  let saldoAtual = snap.exists() ? Number(snap.data().saldo || 0) : 0;
  saldoAtual -= valorPagar;

  await setDoc(ref, {
    nome: nomeMotoboy,
    saldo: saldoAtual
  });

  alert("Entrega e pagamento registrados!");

  carregarListaMotoboys();
  carregarSaldoGeral();
});