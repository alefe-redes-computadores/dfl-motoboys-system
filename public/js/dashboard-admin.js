// ======================================================
// 🔥 Painel Administrativo – DFL
// Arquivo COMPLETO (versão atual finalizada)
// ======================================================

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
  getDocs
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// ======================================================
// 🔒 LISTA DE ADMINISTRADORES AUTORIZADOS (UIDs reais)
// ======================================================
const ADMINS = [
  "6YczX4gLpUStlBVdQOXWc3uEYGG2", // Kaleb
  "LYu3M8gyRdMCqhE90vmH9Jh5Ksj1", // Contato
  "plSHKV043gTpEYfx7I3TI6FsJG93", // Vendas
  "zIfbMxD1SQNvtlX9y6YUsEz2TXC3"  // Álefe
];

// ======================================================
// 🔐 VERIFICA LOGIN + PERMISSÃO
// ======================================================
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
  carregarGraficoDespesas();
});

// ======================================================
// 🚪 Logout
// ======================================================
document.getElementById("logoutAdmin")?.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// ======================================================
// 🏍️ CARREGAR LISTA DE MOTOBOYS
// ======================================================
async function carregarListaMotoboys() {
  const snap = await getDocs(collection(db, "motoboys"));

  snap.forEach((docu) => {
    const dados = docu.data();
    const nome = dados.nome || docu.id;
    const saldo = Number(dados.saldo || 0);

    const elem = document.getElementById(`saldo_${docu.id}`);
    if (elem) {
      elem.textContent = "R$ " + saldo.toFixed(2).replace(".", ",");

      elem.classList.remove("positivo", "negativo", "neutral");
      if (saldo > 0) elem.classList.add("negativo");
      else if (saldo < 0) elem.classList.add("positivo");
      else elem.classList.add("neutral");
    }
  });
}

// ======================================================
// 💰 SALDO GERAL
// ======================================================
async function carregarSaldoGeral() {
  const snap = await getDocs(collection(db, "motoboys"));

  let total = 0;
  snap.forEach((d) => total += Number(d.data().saldo || 0));

  const el = document.getElementById("saldoGeral");
  el.textContent = "R$ " + total.toFixed(2).replace(".", ",");
  el.classList.remove("positivo", "negativo", "neutral");

  if (total > 0) el.classList.add("negativo");
  else if (total < 0) el.classList.add("positivo");
  else el.classList.add("neutral");
}

// ======================================================
// 🧾 REGISTRAR DESPESAS
// ======================================================
document.getElementById("btnSalvarDespesa")?.addEventListener("click", async () => {

  const desc = document.getElementById("descDespesa").value.trim();
  const valor = Number(document.getElementById("valorDespesa").value);
  const data = document.getElementById("dataDespesa").value;

  if (!desc || !valor || !data) {
    alert("Preencha todos os campos.");
    return;
  }

  await addDoc(collection(db, "despesas"), {
    desc,
    valor,
    data,
    timestamp: new Date()
  });

  document.getElementById("descDespesa").value = "";
  document.getElementById("valorDespesa").value = "";
  document.getElementById("dataDespesa").value = "";

  alert("Despesa registrada!");
  carregarGraficoDespesas();
});

// ======================================================
// 📦 REGISTRO DE ESTOQUE (com categorias completas)
// ======================================================
document.getElementById("btnSalvarEstoque")?.addEventListener("click", async () => {
  const categoria = document.getElementById("estoqueCategoria").value;
  const data = document.getElementById("estoqueData").value;

  if (!categoria || !data) {
    alert("Preencha a data e categoria.");
    return;
  }

  // Coleta todos inputs daquela categoria
  const campos = document.querySelectorAll(`input[data-cat="${categoria}"]`);
  let itens = {};

  campos.forEach((c) => {
    itens[c.dataset.item] = Number(c.value || 0);
  });

  await addDoc(collection(db, "estoque"), {
    categoria,
    data,
    itens,
    timestamp: new Date()
  });

  alert("Estoque registrado!");
});

// ======================================================
// 📬 REGISTRAR ENTREGAS MANUAIS
// ======================================================
document.getElementById("btnSalvarEntregaManual")?.addEventListener("click", async () => {
  const motoboy = document.getElementById("entregaMotoboy").value;
  const qtd = Number(document.getElementById("entregaQtd").value);
  const data = document.getElementById("entregaData").value;

  if (!motoboy || !qtd || !data) {
    alert("Preencha todos os campos.");
    return;
  }

  await addDoc(collection(db, "entregasManuais"), {
    motoboy,
    qtd,
    data,
    timestamp: new Date()
  });

  alert("Entrega registrada!");
});

// ======================================================
// 📊 GRÁFICO DE DESPESAS
// ======================================================
async function carregarGraficoDespesas() {
  const snap = await getDocs(collection(db, "despesas"));

  let datas = [];
  let valores = [];

  snap.forEach((d) => {
    datas.push(d.data().data);
    valores.push(d.data().valor);
  });

  const combinado = datas.map((d, i) => ({ d, v: valores[i] }))
    .sort((a, b) => a.d.localeCompare(b.d));

  datas = combinado.map(x => x.d);
  valores = combinado.map(x => x.v);

  new Chart(document.getElementById("graficoDespesas"), {
    type: "bar",
    data: {
      labels: datas,
      datasets: [{
        label: "Despesas (R$)",
        data: valores,
        backgroundColor: "#ffca28"
      }]
    },
    options: {
      responsive: true
    }
  });
}

// ======================================================
// 🎛️ ACORDEÕES (Frios, Refrigerantes, Pães, Embalagens…)
// ======================================================
const acc = document.getElementsByClassName("accordion");

for (let i = 0; i < acc.length; i++) {
  acc[i].addEventListener("click", function () {
    this.classList.toggle("active");
    const panel = this.nextElementSibling;

    if (panel.style.maxHeight) panel.style.maxHeight = null;
    else panel.style.maxHeight = panel.scrollHeight + "px";
  });
}