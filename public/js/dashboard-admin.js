// =====================================
//  FIREBASE IMPORTS
// =====================================
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


// =====================================
//  IDS DOS ADMINISTRADORES
// =====================================
const ADMINS = [
  "6YczX4gLpUStlBVdQOXWc3uEYGG2",
  "LYu3M8gyRdMCqhE90vmH9Jh5Ksj1",
  "plSHKV043gTpEYfx7I3TI6FsJG93",
  "zIfbMxD1SQNvtlX9y6YUsEz2TXC3"
];


// =====================================
//  VERIFICA LOGIN + REDIRECIONAMENTO
// =====================================
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

  carregarSaldoMotoboy();
  carregarSaldoGeral();
  carregarGraficoDespesas();
});


// =====================================
//  LOGOUT
// =====================================
document.getElementById("logoutAdmin")?.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});


// =====================================
//  1) SALDO INDIVIDUAL DO MOTOBOY
// =====================================
async function carregarSaldoMotoboy() {
  const snap = await getDocs(collection(db, "motoboys"));

  snap.forEach((docu) => {
    const dados = docu.data();
    const nome = dados.nome;
    const saldo = Number(dados.saldo || 0);

    // Para o Lucas — ID correspondente ao seu HTML:
    if (docu.id === "lucas_hiago") {
      const campo = document.getElementById("saldo_lucas_hiago");

      if (campo) {
        campo.innerText = "R$ " + saldo.toFixed(2).replace(".", ",");

        campo.classList.remove("negativo", "positivo", "neutral");

        if (saldo > 0) campo.classList.add("negativo");      // vermelho = deve ao motoboy
        else if (saldo < 0) campo.classList.add("positivo"); // verde = motoboy deve
        else campo.classList.add("neutral");
      }
    }
  });
}



// =====================================
//  2) SALDO GERAL (SOMA DOS MOTOBOYS)
// =====================================
async function carregarSaldoGeral() {
  const snap = await getDocs(collection(db, "motoboys"));
  let total = 0;

  snap.forEach((d) => total += Number(d.data().saldo || 0));

  const saldoEl = document.getElementById("saldoGeral");

  saldoEl.innerText = "R$ " + total.toFixed(2).replace(".", ",");

  saldoEl.classList.remove("positivo", "negativo", "neutral");

  if (total > 0) saldoEl.classList.add("negativo");     // vermelho
  else if (total < 0) saldoEl.classList.add("positivo"); // verde
  else saldoEl.classList.add("neutral");
}



// =====================================
//  3) REGISTRAR DESPESAS
// =====================================
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



// =====================================
//  4) GRÁFICO DE DESPESAS
// =====================================
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



// =====================================
//  5) REGISTRAR ESTOQUE
// =====================================
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



// =====================================
//  6) REGISTRAR ENTREGA MANUAL
// =====================================
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