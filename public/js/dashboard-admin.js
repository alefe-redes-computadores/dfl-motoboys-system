// ============================================================
//  DFL — DASHBOARD ADMIN (VERSÃO ESTÁVEL FINAL)
//  ✅ ESTOQUE INTACTO
//  ✅ LOGÍSTICA 7 DIAS FUNCIONANDO
//  ✅ MOTOBOY AVULSO SOBE NO PAINEL
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
//  🔐 ADMINS
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

// ============================================================
//  🎨 SALDO COR
// ============================================================
function getClasseSaldo(v) {
  if (v > 0) return "positivo";
  if (v < 0) return "negativo";
  return "neutral";
}

// ============================================================
//  🚪 HEADER
// ============================================================
$("logoutAdmin")?.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

$("btnRelatorios")?.addEventListener("click", () => {
  window.location.href = "relatorios.html";
});

// ============================================================
//  📦 ESTOQUE (NÃO MEXER)
// ============================================================
const SUBITENS = {
  frios: [
    "Bacon","Carne Moída/Artesanais","Cheddar","Filé de Frango",
    "Hambúrguer","Mussarela","Presunto","Salsicha"
  ],
  refrigerantes: [
    "Coca 200ml","Coca 310ml","Coca 310ml Zero","Coca 1L",
    "Coca 1L Zero","Coca 2L","Del Valle 450ml Uva",
    "Del Valle 450ml Laranja","Fanta 1L","Kuat 2L"
  ],
  embalagens: [
    "Bobina","Dogueira","Hamburgueira","Papel Kraft",
    "Saco Plástico","Sacola 30x40","Sacola 38x48"
  ],
  paes: ["Pão Hambúrguer","Pão Hot Dog"],
  hortifruti: [
    "Alface","Batata Palha","Cebola","Cebolinha",
    "Milho","Óleo","Ovo","Tomate"
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
  const cat = $("estoqueCategoria");
  const item = $("estoqueItem");
  if (!cat || !item) return;

  cat.innerHTML =
    `<option value="">Selecione...</option>` +
    CATEGORIAS.map(c => `<option value="${c.id}">${c.label}</option>`).join("");

  item.innerHTML = `<option value="">Selecione a categoria...</option>`;

  cat.addEventListener("change", () => {
    const lista = SUBITENS[cat.value] || [];
    item.innerHTML =
      `<option value="">Selecione...</option>` +
      lista.map(i => `<option value="${i}">${i}</option>`).join("");
  });
}

$("btnGerarPdfEstoque")?.addEventListener("click", () => {
  window.location.href = "pdf-estoque.html";
});

async function verificarEstoqueHoje() {
  const btn = $("btnGerarPdfEstoque");
  if (!btn) return;

  const q = query(
    collection(db, "estoqueDia"),
    where("data", "==", todayISO_BR())
  );
  const snap = await getDocs(q);
  btn.style.display = snap.size > 0 ? "block" : "none";
}

// ============================================================
//  🛵 MOTOBOYS
// ============================================================
async function carregarListaMotoboys() {
  const lista = $("listaMotoboys");
  if (!lista) return;

  lista.innerHTML = "<p>Carregando...</p>";
  const snap = await getDocs(collection(db, "motoboys"));

  let html = "";
  snap.forEach(d => {
    const x = d.data();
    const saldo = Number(x.saldo || 0);

    html += `
      <div class="motoboy-item ${getClasseSaldo(saldo)}">
        <div>
          <strong>${x.nome || d.id}</strong>
          <span class="saldo">${moneyBR(saldo)}</span>
        </div>
      </div>
    `;
  });

  lista.innerHTML = html;
}

async function carregarSaldoGeral() {
  const snap = await getDocs(collection(db, "motoboys"));
  let total = 0;
  snap.forEach(d => total += Number(d.data().saldo || 0));

  const el = $("saldoGeral");
  if (el) {
    el.textContent = moneyBR(total);
    el.className = "admin-value " + getClasseSaldo(total);
  }
}

// ============================================================
//  📦 LOGÍSTICA 7 DIAS (FUNCIONANDO)
// ============================================================
async function carregarLogisticaSemana() {
  const el = $("logisticaSemana");
  if (!el) return;

  const hoje = new Date();
  const inicio = new Date();
  inicio.setDate(hoje.getDate() - 6);

  const q = query(
    collection(db, "entregasManuais"),
    where("data", ">=", inicio.toISOString().slice(0, 10)),
    where("data", "<=", todayISO_BR())
  );

  const snap = await getDocs(q);
  let total = 0;
  snap.forEach(d => total += Number(d.data().valorPago || 0));

  el.textContent = moneyBR(total);
}

// ============================================================
//  🛵 ENTREGA MANUAL
// ============================================================
$("btnSalvarEntregaManual")?.addEventListener("click", async () => {
  const tipo = $("entregaMotoboy").value;
  const qtd = Number($("entregaQtd").value || 0);
  const valorManual = Number($("valorPagoMotoboy").value || 0);
  const data = $("entregaData").value;
  const nomeOutro = $("entregaMotoboyOutro")?.value.trim();

  if (!qtd || !data) return alert("Preencha tudo.");

  let nomeMotoboy = "";
  let valorPago = 0;
  let idMotoboy = tipo;

  if (tipo === "lucas_hiago") {
    nomeMotoboy = "Lucas Hiago";
    valorPago = qtd * 6;
    const ref = doc(db, "motoboys", "lucas_hiago");
    const snap = await getDoc(ref);
    await updateDoc(ref, { saldo: Number(snap.data().saldo || 0) + valorPago });

  } else if (tipo === "rodrigo_goncalves") {
    nomeMotoboy = "Rodrigo Gonçalves";
    valorPago = qtd <= 10 ? 100 : 100 + (qtd - 10) * 7;

  } else {
    if (!nomeOutro) return alert("Informe o nome.");
    nomeMotoboy = nomeOutro;
    valorPago = valorManual;
    idMotoboy = nomeOutro.toLowerCase().replace(/\s+/g, "_");

    await setDoc(doc(db, "motoboys", idMotoboy), {
      nome: nomeMotoboy,
      saldo: 0
    }, { merge: true });
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
  await carregarLogisticaSemana();
});

// ============================================================
//  INIT
// ============================================================
onAuthStateChanged(auth, async (user) => {
  if (!user) return window.location.href = "index.html";
  if (!ADMINS.includes(user.uid)) return alert("Acesso restrito.");

  initEstoqueUI();
  await verificarEstoqueHoje();
  await carregarListaMotoboys();
  await carregarSaldoGeral();
  await carregarLogisticaSemana();
});