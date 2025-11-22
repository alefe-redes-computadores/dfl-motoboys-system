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


// ==========================
// ADMINISTRADORES AUTORIZADOS
// ==========================
const ADMINS = [
  "6YczX4gLpUStlBVdQOXWc3uEYGG2",
  "LYu3M8gyRdMCqhE90vmH9Jh5Ksj1",
  "plSHKV043gTpEYfx7I3TI6FsJG93",
  "zIfbMxD1SQNvtlX9y6YUsEz2TXC3"
];


// ==========================
// VERIFICA LOGIN + PERMISSÃO
// ==========================
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

  carregarSaldoGeral();
  carregarGraficoDespesas();
});


// ==========================
// Logout
// ==========================
document.getElementById("logoutAdmin")?.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});


// ==========================
// SALDO GERAL (soma dos saldos dos motoboys)
// ==========================
async function carregarSaldoGeral() {
  const snap = await getDocs(collection(db, "motoboys"));

  let total = 0;
  snap.forEach((d) => total += Number(d.data().saldo || 0));

  document.getElementById("saldoGeral").innerText =
    "R$ " + total.toFixed(2).replace(".", ",");
}


// ==========================
// REGISTRAR DESPESA
// ==========================
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

  alert("Despesa registrada!");
  carregarGraficoDespesas();
});


// ==========================
// GRÁFICO DE DESPESAS
// ==========================
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


// ==========================
// REGISTRAR ESTOQUE
// ==========================
document.getElementById("btnSalvarEstoque")?.addEventListener("click", async () => {
  const categoria = document.getElementById("estoqueCategoria").value;
  const quantidade = Number(document.getElementById("estoqueQtd").value);
  const data = document.getElementById("estoqueData").value;

  if (!categoria || !quantidade || !data) {
    alert("Preencha tudo.");
    return;
  }

  await addDoc(collection(db, "estoque"), {
    categoria,
    quantidade,
    data,
    timestamp: new Date()
  });

  alert("Estoque registrado!");
});


// ==========================
// REGISTRAR ENTREGAS MANUAIS
// ==========================
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