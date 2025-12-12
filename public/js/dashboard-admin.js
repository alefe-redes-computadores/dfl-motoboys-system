// ============================================================
//  DFL — DASHBOARD ADMIN v3.0 (ESTÁVEL + BLINDADO)
//  ✅ Estoque (categorias NÃO somem + PDF aparece)
//  ✅ Motoboys + Saldo Operacional (ordem fixa + botão pagar)
//  ✅ Caixa Diário + Saldo Financeiro (saldo do dia)
//  ✅ Logística (últimos 7 dias)
//  ✅ Mostra erro na tela se algo falhar (não fica "mudo")
// ============================================================

import { auth, db } from "./firebase-config-v2.js";

import {
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc,
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

const moneyBR = (n) =>
  `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;

const todayISO_BR = () =>
  new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);

// últimos X dias (inclui hoje)
function lastDaysISO(count) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 10);
    out.push(iso);
  }
  return out;
}

function safe(fn) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (e) {
      console.error("[DFL ADMIN] ERRO:", e);
      showFatalOnScreen(e);
      return null;
    }
  };
}

function showFatalOnScreen(e) {
  if (document.getElementById("dflAdminFatal")) return;

  const box = document.createElement("div");
  box.id = "dflAdminFatal";
  box.style.cssText = `
    position: fixed;
    left: 12px;
    right: 12px;
    bottom: 12px;
    z-index: 99999;
    background: rgba(229,57,53,0.95);
    color: #fff;
    padding: 12px 14px;
    border-radius: 12px;
    font-family: system-ui, -apple-system, Segoe UI, sans-serif;
    box-shadow: 0 10px 30px rgba(0,0,0,0.6);
    font-size: 13px;
    line-height: 1.35;
  `;

  const msg = (e && (e.message || String(e))) ? (e.message || String(e)) : "Erro desconhecido";
  box.innerHTML = `
    <strong>⚠️ Painel Admin: erro no JavaScript</strong><br>
    ${msg}<br>
    <span style="opacity:.9">Abra o console (F12) para ver detalhes.</span>
  `;
  document.body.appendChild(box);
}

// ============================================================
//  🎨 CLASSE DO SALDO
// ============================================================
function getClasseSaldo(valor) {
  if (valor > 0) return "positivo";
  if (valor < 0) return "negativo";
  return "neutral";
}

// ============================================================
//  🚪 LOGOUT / HEADER
// ============================================================
function bindHeaderButtons() {
  $("logoutAdmin")?.addEventListener("click", safe(async () => {
    await signOut(auth);
    window.location.href = "index.html";
  }));

  $("btnRelatorios")?.addEventListener("click", () => {
    window.location.href = "relatorios.html";
  });

  $("btnMiniPDV")?.addEventListener("click", () => {
    window.location.href = "pdv.html";
  });
}

// ============================================================
//  📦 CATEGORIAS / ITENS DE ESTOQUE (OFICIAL)  ✅ NÃO MEXER
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

  if (!categoriaSel || !itemSel) return;

  categoriaSel.innerHTML =
    `<option value="">Selecione...</option>` +
    CATEGORIAS.map(c => `<option value="${c.id}">${c.label}</option>`).join("");

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
//  📦 REGISTRAR ESTOQUE (✅ mantém PDF e subitens)
// ============================================================
function bindEstoque() {
  $("btnSalvarEstoque")?.addEventListener("click", safe(async () => {
    const categoria = $("estoqueCategoria")?.value || "";
    const item = $("estoqueItem")?.value || "";
    const quantidade = ($("estoqueQtd")?.value || "").trim();
    const dataRaw = $("estoqueData")?.value || "";

    if (!categoria || !item || !quantidade || !dataRaw) {
      alert("Preencha tudo.");
      return;
    }

    const data = new Date(dataRaw + "T12:00:00").toISOString().slice(0, 10);

    await addDoc(collection(db, "estoqueDia"), {
      categoria,
      item,
      quantidade,
      data,
      timestamp: Date.now()
    });

    alert("Estoque salvo!");
    await verificarEstoqueHoje();
  }));

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
//  🧾 DESPESAS
// ============================================================
function bindDespesas() {
  $("btnSalvarDespesa")?.addEventListener("click", safe(async () => {
    const desc = ($("descDespesa")?.value || "").trim();
    const valor = Number($("valorDespesa")?.value || 0);
    const dataRaw = $("dataDespesa")?.value || "";

    if (!desc || !valor || !dataRaw) {
      alert("Preencha tudo.");
      return;
    }

    const data = new Date(dataRaw + "T12:00:00").toISOString().slice(0, 10);

    // 1. Grava na coleção original "despesas"
    await addDoc(collection(db, "despesas"), {
      descricao: desc,
      valor,
      data,
      timestamp: Date.now()
    });

    // ✅ AJUSTE OBRIGATÓRIO: Grava também no "caixaDiario" como SAÍDA
    await addDoc(collection(db, "caixaDiario"), {
      tipo: "saida",
      categoria: "Despesa",
      descricao: `Despesa - ${desc}`,
      valor: valor,
      data: data,
      timestamp: Date.now()
    });

    alert("Despesa registrada!");

    // Atualiza a tela do caixa imediatamente
    await carregarCaixaHoje();
    await calcularResumoDia();
    await carregarSaldoFinanceiro();
  }));
}

// ============================================================
//  💸 CAIXA DIÁRIO
// ============================================================
function bindCaixa() {
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
    await carregarSaldoFinanceiro();
  }));
}

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
      <div class="caixa-item ${x.tipo || ""}">
        <strong>${String(x.tipo || "").toUpperCase()}</strong> — ${x.categoria || ""}
        <br>${x.descricao || ""}
        <br>
        <span class="valor">${moneyBR(x.valor)}</span>
        <span style="float:right; opacity:0.7;">${hora}</span>
        <hr>
      </div>
    `;
  });

  lista.innerHTML = html;
}

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

  $("resumoEntradas") && ($("resumoEntradas").textContent = moneyBR(entradas));
  $("resumoSaidas") && ($("resumoSaidas").textContent = moneyBR(saidas));
  $("resumoSaldoDia") && ($("resumoSaldoDia").textContent = moneyBR(saldo));
}

async function carregarSaldoFinanceiro() {
  const el = $("saldoFinanceiro");
  if (!el) return;

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

  el.textContent = moneyBR(saldo);
  el.className = "admin-value " + getClasseSaldo(saldo);
}

// ============================================================
//  🛵 MOTOBOYS (ORDEM FIXA + BOTÃO PAGAR)
// ============================================================
const FIXED_ORDER = ["lucas_hiago", "rodrigo_goncalves"];

function normalizeMotoboyId(nome) {
  return String(nome || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40) || "avulso";
}

async function ensureFixedMotoboysExist() {
  // garante docs dos fixos (não altera saldo existente)
  const defaults = {
    lucas_hiago: { nome: "Lucas Hiago", saldo: 0, tipo: "fixo" },
    rodrigo_goncalves: { nome: "Rodrigo Gonçalves", saldo: 0, tipo: "fixo" }
  };

  for (const id of FIXED_ORDER) {
    const ref = doc(db, "motoboys", id);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        ...defaults[id],
        createdAt: Date.now()
      }, { merge: true });
    }
  }
}

async function carregarListaMotoboys() {
  const listaEl = $("listaMotoboys");
  if (!listaEl) return;

  listaEl.innerHTML = "<p>Carregando...</p>";

  await ensureFixedMotoboysExist();

  const snap = await getDocs(collection(db, "motoboys"));

  const map = new Map();
  snap.forEach((d) => map.set(d.id, { id: d.id, ...d.data() }));

  // fixa: lucas, rodrigo
  const fixed = FIXED_ORDER
    .map(id => map.get(id))
    .filter(Boolean)
    .map(x => ({
      id: x.id,
      nome: x.nome || x.id,
      saldo: Number(x.saldo || 0),
      tipo: x.tipo || "fixo"
    }));

  // avulsos: tudo que não é fixo
  const avulsos = Array.from(map.values())
    .filter(x => !FIXED_ORDER.includes(x.id))
    .map(x => ({
      id: x.id,
      nome: x.nome || x.id,
      saldo: Number(x.saldo || 0),
      tipo: x.tipo || "avulso"
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }));

  const listaFinal = [...fixed, ...avulsos];

  let html = "";

  for (const m of listaFinal) {
    const classe = getClasseSaldo(Number(m.saldo || 0));

    // botão pagar SÓ para fixos (Lucas/Rodrigo)
    const showPay = FIXED_ORDER.includes(m.id);

    html += `
      <div class="motoboy-item ${classe}">
        <div class="motoboy-info">
          <strong>${m.nome}</strong>
          <span class="saldo">${moneyBR(m.saldo)}</span>
        </div>

        ${showPay ? `
          <button class="btnPagar"
            data-id="${m.id}"
            data-nome="${m.nome}">
            💸 Pagar
          </button>
        ` : ``}
      </div>
    `;
  }

  listaEl.innerHTML = html;

  document.querySelectorAll(".btnPagar").forEach(btn => {
    btn.addEventListener("click", abrirModalPagamento);
  });
}

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
//  📦 LOGÍSTICA — ÚLTIMOS 7 DIAS (entregasManuais)
// ============================================================
async function carregarLogisticaSemana() {
  const el = $("logisticaSemana");
  if (!el) return;

  const dias = lastDaysISO(7);

  const q = query(
    collection(db, "entregasManuais"),
    where("data", "in", dias)
  );

  const snap = await getDocs(q);

  let total = 0;
  snap.forEach((d) => {
    total += Number(d.data().valorPago || 0);
  });

  el.textContent = moneyBR(total);
}

// ============================================================
//  💸 MODAL PAGAMENTO (lógica mantém)
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
  
  const inputData = $("modalDataPagamento");
  if (inputData) inputData.value = todayISO_BR();

  modal?.classList.remove("hidden");
}

cancelarPagamentoBtn?.addEventListener("click", () => {
  modal?.classList.add("hidden");
  pagamentoMotoboyId = null;
  if (inputValorPagamento) inputValorPagamento.value = "";
});

modal?.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.classList.add("hidden");
    pagamentoMotoboyId = null;
    if (inputValorPagamento) inputValorPagamento.value = "";
  }
});

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
    saldoAtual -= valor;
    await updateDoc(ref, { saldo: saldoAtual });
  } else {
    await updateDoc(ref, { saldo: 0 });
  }

  await addDoc(collection(db, "despesas"), {
    descricao: `Pagamento motoboy - ${dados.nome || pagamentoMotoboyId}`,
    valor,
    data: todayISO_BR(),
    timestamp: Date.now()
  });

  modal?.classList.add("hidden");
  if (inputValorPagamento) inputValorPagamento.value = "";
  pagamentoMotoboyId = null;

  await carregarListaMotoboys();
  await carregarSaldoGeral();
  await carregarLogisticaSemana();

  alert("Pagamento registrado!");
}));

// ============================================================
//  🛵 REGISTRAR ENTREGA MANUAL (avulsos sobem pro painel com saldo 0)
// ============================================================
function bindEntregas() {
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
    let motoboyDocId = idMotoboy;

    if (idMotoboy === "lucas_hiago") {
      nomeMotoboy = "Lucas Hiago";
      valorPago = qtd * 6;

      const ref = doc(db, "motoboys", "lucas_hiago");
      const snap = await getDoc(ref);
      let saldoAtual = Number(snap.data()?.saldo || 0);
      saldoAtual += valorPago;
      await updateDoc(ref, { saldo: saldoAtual });

    } else if (idMotoboy === "rodrigo_goncalves") {
      nomeMotoboy = "Rodrigo Gonçalves";
      
      // ✅ AJUSTE: Garante que Rodrigo entra na logistica (valorPago) mesmo com saldo 0
      valorPago = (qtd <= 10) ? 100 : (100 + (qtd - 10) * 7);
      motoboyDocId = "rodrigo_goncalves";

      await updateDoc(doc(db, "motoboys", idMotoboy), { saldo: 0 });

    } else if (idMotoboy === "outro") {
      if (!nomeOutro) {
        alert("Informe o nome do motoboy.");
        return;
      }

      nomeMotoboy = nomeOutro;
      valorPago = valorManual || 0;

      // ✅ cria/atualiza o avulso na coleção motoboys com saldo 0 (apenas relatório)
      const slug = normalizeMotoboyId(nomeOutro);
      motoboyDocId = `avulso_${slug}`;

      await setDoc(doc(db, "motoboys", motoboyDocId), {
        nome: nomeOutro,
        saldo: 0,
        tipo: "avulso",
        updatedAt: Date.now()
      }, { merge: true });
    }

    await addDoc(collection(db, "entregasManuais"), {
      nomeMotoboy,
      motoboy: motoboyDocId,  // ✅ salva o doc id real (fixo ou avulso)
      quantidade: qtd,
      valorPago,
      data,
      timestamp: Date.now()
    });

    alert("Entrega registrada!");

    await carregarListaMotoboys();
    await carregarSaldoGeral();
    await carregarLogisticaSemana();
  }));
}

// ============================================================
//  ✅ INIT GERAL (DOM + AUTH)
// ============================================================
function initUIBindings() {
  bindHeaderButtons();
  initEstoqueUI();
  bindEstoque();
  bindDespesas();
  bindEntregas();
  bindCaixa();
}

async function initDataAfterAuth() {
  await verificarEstoqueHoje();

  await carregarListaMotoboys();
  await carregarSaldoGeral();

  await carregarCaixaHoje();
  await calcularResumoDia();
  await carregarSaldoFinanceiro();

  await carregarLogisticaSemana();
}

document.addEventListener("DOMContentLoaded", () => {
  initUIBindings();

  onAuthStateChanged(auth, safe(async (user) => {
    if (!user) {
      window.location.href = "index.html";
      return;
    }

    if (!ADMINS.includes(user.uid)) {
      alert("Acesso restrito.");
      window.location.href = "dashboard.html";
      return;
    }

    await initDataAfterAuth();
  }));
});
