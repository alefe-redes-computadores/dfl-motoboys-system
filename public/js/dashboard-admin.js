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

  // ⚠️ Qualquer erro aqui não pode derrubar o resto
  safe(initEstoqueUI)();
  safe(initPdfButton)();

  await safe(carregarListaMotoboys)();
  await safe(carregarSaldoGeral)();
  await safe(verificarEstoqueHoje)();
  await safe(carregarCaixaHoje)();
  await safe(calcularResumoDia)();
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
//  💰 SALDO GERAL (mantém como você usava: só somando saldos)
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
//  📦 CATEGORIAS / ITENS DE ESTOQUE (OFICIAL)
//  ✅ Esse bloco é o que estava “sumindo” quando o JS quebrava
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

function initEstoqueUI() {
  const categoriaSel = $("estoqueCategoria");
  const itemSel = $("estoqueItem");

  // Se a página que abriu não tem esses campos, não faz nada.
  if (!categoriaSel || !itemSel) return;

  categoriaSel.innerHTML =
    `<option value="">Selecione...</option>` +
    CATEGORIAS.map(c => `<option value="${c.id}">${c.label}</option>`).join("");

  // inicia vazio
  itemSel.innerHTML = `<option value="">Selecione a categoria...</option>`;

  categoriaSel.addEventListener("change", () => {
    const lista = SUBITENS[categoriaSel.value] || [];
    if (!lista.length) {
      itemSel.innerHTML = `<option value="">Selecione a categoria...</option>`;
      return;
    }
    itemSel.innerHTML =
      `<option value="">Selecione...</option>` +
      lista.map(i => `<option value="${i}">${i}</option>`).join("");
  });
}

// ============================================================
//  📦 REGISTRAR ESTOQUE
// ============================================================
$("btnSalvarEstoque")?.addEventListener("click", safe(async () => {
  const categoriaSel = $("estoqueCategoria");
  const itemSel = $("estoqueItem");

  const item = itemSel?.value || "";
  const categoria = categoriaSel?.value || "";
  const quantidade = $("estoqueQtd")?.value || "";
  const dataBruta = $("estoqueData")?.value || "";

  if (!item || !categoria || !quantidade || !dataBruta) {
    alert("Preencha tudo.");
    return;
  }

  // padroniza data
  const data = new Date(dataBruta + "T12:00:00").toISOString().slice(0, 10);

  await addDoc(collection(db, "estoqueDia"), {
    item,
    categoria,
    quantidade,
    data
  });

  alert("Estoque salvo!");
  await verificarEstoqueHoje();
}));

// ============================================================
//  📦 MOSTRAR BOTÃO PDF (ESTOQUE DO DIA)
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
//  🧾 REGISTRAR DESPESA
// ============================================================
$("btnSalvarDespesa")?.addEventListener("click", safe(async () => {
  const desc = ($("descDespesa")?.value || "").trim();
  const valor = Number($("valorDespesa")?.value || 0);
  const dataRaw = $("dataDespesa")?.value || "";

  if (!desc || !valor || !dataRaw) {
    alert("Preencha tudo.");
    return;
  }

  const data = new Date(dataRaw + "T12:00:00").toISOString().slice(0, 10);

  await addDoc(collection(db, "despesas"), { descricao: desc, valor, data });

  alert("Despesa registrada!");
}));

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
  if (inputValorPagamento) inputValorPagamento.value = "";
});

// ============================================================
//  💵 CONFIRMAR PAGAMENTO (LÓGICA OFICIAL)
//  ✅ Lucas: subtrai do saldo (dívida diminui)
//  ✅ Outros: não acumula saldo (mantém 0) mas salva despesa p/ relatório
// ============================================================
confirmarPagamentoBtn?.addEventListener("click", safe(async () => {
  const valor = Number(inputValorPagamento?.value || 0);

  if (!valor || valor <= 0) {
    alert("Valor inválido.");
    return;
  }

  if (!pagamentoMotoboyId) {
    alert("Motoboy inválido.");
    return;
  }

  const ref = doc(db, "motoboys", pagamentoMotoboyId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    alert("Erro: motoboy não encontrado.");
    return;
  }

  const dados = snap.data();

  if (pagamentoMotoboyId === "lucas_hiago") {
    let saldoAtual = Number(dados.saldo || 0);
    saldoAtual -= valor; // ✅ ABATE (dívida reduz)
    await updateDoc(ref, { saldo: saldoAtual });
  } else {
    // Mantém zerado
    await updateDoc(ref, { saldo: 0 });
  }

  // registra despesa do pagamento (para relatórios)
  await addDoc(collection(db, "despesas"), {
    descricao: `Pagamento motoboy - ${dados.nome || pagamentoMotoboyId}`,
    valor,
    data: todayISO_BR()
  });

  modal?.classList.add("hidden");
  if (inputValorPagamento) inputValorPagamento.value = "";
  pagamentoMotoboyId = null;

  await carregarListaMotoboys();
  await carregarSaldoGeral();

  alert("Pagamento registrado!");
}));

// ============================================================
//  🛵 REGISTRAR ENTREGA MANUAL
// ============================================================
const selectMotoboy = $("entregaMotoboy");
const grupoOutro = $("grupoMotoboyOutro");

selectMotoboy?.addEventListener("change", () => {
  grupoOutro?.classList.toggle("hidden", selectMotoboy.value !== "outro");
});

$("btnSalvarEntregaManual")?.addEventListener("click", safe(async () => {
  const idMotoboy = selectMotoboy?.value || "";
  const qtd = Number($("entregaQtd")?.value || 0);
  const valorManual = Number($("valorPagoMotoboy")?.value || 0);
  const dataRaw = $("entregaData")?.value || "";
  const nomeOutro = ($("entregaMotoboyOutro")?.value || "").trim();

  if (!qtd || !dataRaw) {
    alert("Preencha tudo.");
    return;
  }

  const data = new Date(dataRaw + "T12:00:00").toISOString().slice(0, 10);

  let nomeMotoboy = "";
  let valorPago = 0;

  if (idMotoboy === "lucas_hiago") {
    nomeMotoboy = "Lucas Hiago";
    valorPago = qtd * 6;

    const ref = doc(db, "motoboys", "lucas_hiago");
    const snap = await getDoc(ref);
    let saldoAtual = Number(snap.data()?.saldo || 0);
    saldoAtual += valorPago; // ✅ acumula dívida por entrega
    await updateDoc(ref, { saldo: saldoAtual });

  } else if (idMotoboy === "rodrigo_goncalves") {
    nomeMotoboy = "Rodrigo Gonçalves";
    if (qtd <= 10) valorPago = 100;
    else valorPago = 100 + (qtd - 10) * 7;

    // não acumula no saldo
    await updateDoc(doc(db, "motoboys", idMotoboy), { saldo: 0 });

  } else if (idMotoboy === "outro") {
    if (!nomeOutro) {
      alert("Informe o nome do motoboy.");
      return;
    }
    nomeMotoboy = nomeOutro;
    valorPago = valorManual || 0;
  }

  await addDoc(collection(db, "entregasManuais"), {
    nomeMotoboy,
    motoboy: idMotoboy,
    quantidade: qtd,
    valorPago,
    data,
    timestamp: Date.now()
  });

  alert("Entrega registrada!");

  await carregarListaMotoboys();
  await carregarSaldoGeral();
}));

// ============================================================
//  💸 CAIXA DIÁRIO — coleção oficial: caixaDiario
// ============================================================
$("btnRegistrarCaixa")?.addEventListener("click", safe(async () => {
  const tipo = $("caixaTipo")?.value || "";
  const categoria = $("caixaCategoria")?.value || "";
  const descricao = ($("caixaDescricao")?.value || "").trim();
  const valor = Number($("caixaValor")?.value || 0);
  const dataRaw = $("caixaData")?.value || "";

  if (!descricao || !valor || !dataRaw) {
    alert("Preencha tudo.");
    return;
  }

  const data = new Date(dataRaw + "T12:00:00").toISOString().slice(0, 10);

  await addDoc(collection(db, "caixaDiario"), {
    tipo,
    categoria,
    descricao,
    valor,
    data,
    timestamp: Date.now()
  });

  alert("Movimentação registrada!");
  await carregarCaixaHoje();
  await calcularResumoDia();
}));

// ============================================================
//  📄 MOVIMENTAÇÕES DE HOJE
// ============================================================
async function carregarCaixaHoje() {
  const lista = $("listaCaixaHoje");
  if (!lista) return;

  lista.innerHTML = "<p>Carregando...</p>";

  const hoje = todayISO_BR();

  const q = query(
    collection(db, "caixaDiario"),
    where("data", "==", hoje),
    orderBy("timestamp", "desc")
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    lista.innerHTML = "<p>Nenhuma movimentação hoje.</p>";
    return;
  }

  let html = "";

  snap.forEach((docu) => {
    const x = docu.data();
    const hora = new Date(x.timestamp || Date.now()).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    });

    html += `
      <div class="caixa-item">
        <strong>${String(x.tipo || "").toUpperCase()}</strong> — ${x.categoria || ""}
        <br>${x.descricao || ""}
        <br>
        <span style="color:#ffca28;">${moneyBR(x.valor)}</span>
        <span style="float:right; opacity:0.7;">${hora}</span>
        <hr>
      </div>
    `;
  });

  lista.innerHTML = html;
}

// ============================================================
//  📊 RESUMO DO DIA — Entradas / Saídas / Saldo
// ============================================================
async function calcularResumoDia() {
  const hoje = todayISO_BR();

  const q = query(collection(db, "caixaDiario"), where("data", "==", hoje));
  const snap = await getDocs(q);

  let entradas = 0;
  let saidas = 0;

  snap.forEach((d) => {
    const x = d.data();
    if (x.tipo === "entrada") entradas += Number(x.valor || 0);
    else saidas += Number(x.valor || 0);
  });

  const saldo = entradas - saidas;

  const elEntradas = $("resumoEntradas");
  const elSaidas = $("resumoSaidas");
  const elSaldo = $("resumoSaldoDia");

  if (elEntradas) elEntradas.textContent = moneyBR(entradas);
  if (elSaidas) elSaidas.textContent = moneyBR(saidas);
  if (elSaldo) elSaldo.textContent = moneyBR(saldo);
}