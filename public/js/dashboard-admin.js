// ============================================================
//  DFL — DASHBOARD ADMIN (VERSÃO 2025 CORRIGIDA)
//  Lógica oficial: Lucas Hiago acumula saldo.
//  Rodrigo tem taxa diferenciada. Avulsos não acumulam.
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
  carregarSaldoGeral();
  verificarEstoqueHoje();
});

// ============================================================
//  🚪 LOGOUT
// ============================================================
document.getElementById("logoutAdmin")?.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// ============================================================
//  📁 BOTÃO RELATÓRIOS
// ============================================================
document.getElementById("btnRelatorios")?.addEventListener("click", () => {
  window.location.href = "relatorios.html";
});

// ============================================================
//  🎨 COR DO SALDO
// ============================================================
function getClasseSaldo(saldo) {
  if (saldo > 0) return "negativo";
  if (saldo < 0) return "positivo";
  return "neutral";
}


// ============================================================
//  📌 LISTAR MOTOBOYS
// ============================================================
async function carregarListaMotoboys() {
  const listaEl = document.getElementById("listaMotoboys");
  listaEl.innerHTML = "<p>Carregando...</p>";

  const snap = await getDocs(collection(db, "motoboys"));

  let html = "";
  snap.forEach((d) => {
    const x = d.data();
    let saldo = Number(x.saldo || 0);
    const id = d.id;

    // 🔥 regra: somente lucas_hiago exibe saldo real
    if (id !== "lucas_hiago") {
      saldo = 0;
    }

    const classe = getClasseSaldo(saldo);

    html += `
      <div class="motoboy-item ${classe}">
        <div class="motoboy-info">
          <strong>${x.nome}</strong>
          <span class="saldo">R$ ${saldo.toFixed(2).replace(".", ",")}</span>
        </div>

        <button class="btnPagar" 
          data-id="${d.id}" 
          data-nome="${x.nome}" 
          data-saldo="${saldo}">
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
    if (d.id === "lucas_hiago") {
      total += Number(d.data().saldo || 0);
    }
  });

  const el = document.getElementById("saldoGeral");
  el.textContent = "R$ " + total.toFixed(2).replace(".", ",");
  el.className = "admin-value " + getClasseSaldo(total);
}


// ============================================================
//  📦 CATEGORIAS / ITENS DE ESTOQUE
// ============================================================
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

const CATEGORIAS = [
  { id: "frios", label: "Frios" },
  { id: "refrigerantes", label: "Refrigerantes" },
  { id: "embalagens", label: "Embalagens" },
  { id: "paes", label: "Pães" },
  { id: "hortifruti", label: "Hortifruti" },
  { id: "outros_extra", label: "Outros / Extra" }
];

const categoriaSel = document.getElementById("estoqueCategoria");
const itemSel = document.getElementById("estoqueItem");

categoriaSel.innerHTML =
  `<option value="">Selecione...</option>` +
  CATEGORIAS.map(c => `<option value="${c.id}">${c.label}</option>`).join("");

function atualizarItens() {
  const lista = SUBITENS[categoriaSel.value] || [];
  itemSel.innerHTML = lista.map(i => `<option value="${i}">${i}</option>`).join("");
}
categoriaSel.addEventListener("change", atualizarItens);


// ============================================================
//  📦 REGISTRAR ESTOQUE
// ============================================================
document.getElementById("btnSalvarEstoque").addEventListener("click", async () => {
  const item = itemSel.value;
  const categoria = categoriaSel.value;
  const quantidade = document.getElementById("estoqueQtd").value;
  let dataBruta = document.getElementById("estoqueData").value;

  if (!item || !categoria || !quantidade || !dataBruta) {
    alert("Preencha tudo.");
    return;
  }

  const dataObj = new Date(dataBruta + "T12:00:00");
  const data = dataObj.toISOString().slice(0, 10);

  await addDoc(collection(db, "estoqueDia"), {
    item,
    categoria,
    quantidade,
    data
  });

  alert("Estoque salvo!");
  verificarEstoqueHoje();
});


// ============================================================
//  📦 MOSTRAR BOTÃO PDF
// ============================================================
async function verificarEstoqueHoje() {
  const hoje = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);

  const q = query(collection(db, "estoqueDia"), where("data", "==", hoje));
  const snap = await getDocs(q);

  const btn = document.getElementById("btnGerarPdfEstoque");
  if (btn) btn.style.display = snap.size > 0 ? "block" : "none";
}

document.getElementById("btnGerarPdfEstoque")?.addEventListener("click", () => {
  window.location.href = "pdf-estoque.html";
});


// ============================================================
//  🧾 REGISTRAR DESPESA
// ============================================================
document.getElementById("btnSalvarDespesa").addEventListener("click", async () => {
  const desc = document.getElementById("descDespesa").value;
  const valor = Number(document.getElementById("valorDespesa").value);
  const dataRaw = document.getElementById("dataDespesa").value;

  if (!desc || !valor || !dataRaw) {
    alert("Preencha tudo.");
    return;
  }

  const dataObj = new Date(dataRaw + "T12:00:00");
  const data = dataObj.toISOString().slice(0, 10);

  await addDoc(collection(db, "despesas"), { descricao: desc, valor, data });

  alert("Despesa registrada!");
});


// ============================================================
//  💸 MODAL PAGAMENTO
// ============================================================
const modal = document.getElementById("modalPagamento");
const inputValorPagamento = document.getElementById("modalValorPagamento");
const confirmarPagamentoBtn = document.getElementById("confirmarPagamento");
const cancelarPagamentoBtn = document.getElementById("cancelarPagamento");
const modalNomeMotoboy = document.getElementById("modalNomeMotoboy");

let pagamentoMotoboyId = null;

function abrirModalPagamento(e) {
  const btn = e.currentTarget;
  pagamentoMotoboyId = btn.dataset.id;

  modalNomeMotoboy.textContent = btn.dataset.nome;
  modal.classList.remove("hidden");
}

cancelarPagamentoBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
  pagamentoMotoboyId = null;
  inputValorPagamento.value = "";
});


// ============================================================
//  💵 CONFIRMAR PAGAMENTO (LÓGICA CORRIGIDA)
// ============================================================
confirmarPagamentoBtn.addEventListener("click", async () => {
  const valor = Number(inputValorPagamento.value);

  if (!valor || valor <= 0) {
    alert("Valor inválido.");
    return;
  }

  const ref = doc(db, "motoboys", pagamentoMotoboyId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    alert("Erro: motoboy não encontrado.");
    return;
  }

  const dados = snap.data();

  // 🔥 REGRAS DEFINITIVAS
  if (pagamentoMotoboyId === "lucas_hiago") {
    // ÚNICO acumulativo
    let saldoAtual = Number(dados.saldo || 0);
    saldoAtual -= valor;

    await updateDoc(ref, { saldo: saldoAtual });

  } else {
    // Rodrigo e Avulsos → saldo sempre 0
    await updateDoc(ref, { saldo: 0 });
  }

  // Registrar despesa
  await addDoc(collection(db, "despesas"), {
    descricao: `Pagamento motoboy - ${dados.nome}`,
    valor,
    data: new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 10)
  });

  modal.classList.add("hidden");
  inputValorPagamento.value = "";

  carregarListaMotoboys();
  carregarSaldoGeral();

  alert("Pagamento registrado!");
});


// ============================================================
//  🛵 REGISTRAR ENTREGA MANUAL — LÓGICA FINAL
// ============================================================
const selectMotoboy = document.getElementById("entregaMotoboy");
const grupoOutro = document.getElementById("grupoMotoboyOutro");

selectMotoboy.addEventListener("change", () => {
  grupoOutro.classList.toggle("hidden", selectMotoboy.value !== "outro");
});

document.getElementById("btnSalvarEntregaManual").addEventListener("click", async () => {
  const idMotoboy = selectMotoboy.value;
  const qtd = Number(document.getElementById("entregaQtd").value);
  const valorManual = Number(document.getElementById("valorPagoMotoboy").value);
  const dataRaw = document.getElementById("entregaData").value;
  const nomeOutro = document.getElementById("entregaMotoboyOutro").value.trim();

  if (!qtd || !dataRaw) {
    alert("Preencha tudo.");
    return;
  }

  const dataObj = new Date(dataRaw + "T12:00:00");
  const data = dataObj.toISOString().slice(0, 10);

  let nomeMotoboy = "";
  let valorPago = 0;

  // ============================================================
  //  REGRAS DE ENTREGA (OFICIAIS)
  // ============================================================

  if (idMotoboy === "lucas_hiago") {
    nomeMotoboy = "Lucas Hiago";
    valorPago = qtd * 6; 

    // Atualizar saldo de Lucas
    const ref = doc(db, "motoboys", "lucas_hiago");
    const snap = await getDoc(ref);
    let saldoAtual = Number(snap.data().saldo || 0);
    saldoAtual += valorPago;
    await updateDoc(ref, { saldo: saldoAtual });

  } else if (idMotoboy === "rodrigo_goncalves") {
    nomeMotoboy = "Rodrigo Gonçalves";

    // 💰 regra: até 10 = 100; acima = 7 por entrega extra
    if (qtd <= 10) {
      valorPago = 100;
    } else {
      valorPago = 100 + (qtd - 10) * 7;
    }

    // Rodrigo não acumula saldo
    await updateDoc(doc(db, "motoboys", idMotoboy), { saldo: 0 });

  } else if (idMotoboy === "outro") {
    if (!nomeOutro) {
      alert("Informe o nome do motoboy.");
      return;
    }
    nomeMotoboy = nomeOutro;
    valorPago = valorManual || 0;
  }

  // Registrar entrega
  await addDoc(collection(db, "entregasManuais"), {
    nomeMotoboy,
    motoboy: idMotoboy,
    quantidade: qtd,
    valorPago,
    data,
    timestamp: Date.now()
  });

  alert("Entrega registrada!");

  carregarListaMotoboys();
  carregarSaldoGeral();
});