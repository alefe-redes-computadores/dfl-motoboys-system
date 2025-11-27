// =======================================================
// DFL – Painel Administrativo
// dashboard-admin.js (COMPLETO)
// =======================================================

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

// Admins permitidos
const ADMINS = [
  "6YczX4gLpUStlBVdQOXWc3uEYGG2",
  "LYu3M8gyRdMCqhE90vmH9Jh5Ksj1",
  "plSHKV043gTpEYfx7I3TI6FsJG93",
  "zIfbMxD1SQNvtlX9y6YUsEz2TXC3"
];

// ======================================
// VERIFICA LOGIN
// ======================================
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

  carregarSaldosMotoboys();
  carregarGraficoDespesas();
});

// ======================================
// LOGOUT
// ======================================
document.getElementById("logoutAdmin")?.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// ======================================
// CARREGAR SALDO DE TODOS MOTOS
// ======================================
async function carregarSaldosMotoboys() {
  const saldoEl = document.getElementById("saldoGeral");

  const lucasEl = document.getElementById("saldo_lucas_hiago");

  let total = 0;

  const snap = await getDocs(collection(db, "motoboys"));

  snap.forEach((docu) => {
    const dados = docu.data();
    const saldo = Number(dados.saldo || 0);

    total += saldo;

    if (docu.id === "lucas_hiago") {
      lucasEl.innerText = "R$ " + saldo.toFixed(2).replace(".", ",");
      lucasEl.classList.remove("positivo", "negativo");
      lucasEl.classList.add(saldo > 0 ? "negativo" : "positivo");
    }
  });

  saldoEl.innerText = "R$ " + total.toFixed(2).replace(".", ",");
  saldoEl.classList.remove("positivo", "negativo");

  if (total > 0) saldoEl.classList.add("negativo");
  else saldoEl.classList.add("positivo");
}

// ======================================
// SALVAR DESPESA
// ======================================
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

// ======================================
// GRÁFICO DE DESPESAS
// ======================================
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

// ======================================
// SALVAR ESTOQUE
// ======================================
document.getElementById("btnSalvarEstoque")?.addEventListener("click", async () => {
  const categoria = document.getElementById("estoqueCategoria").value;
  const item = document.getElementById("estoqueItem").value.trim();
  const qtd = document.getElementById("estoqueQtd").value.trim();
  const data = document.getElementById("estoqueData").value;

  if (!categoria || !item || !qtd || !data) {
    alert("Preencha todos os campos.");
    return;
  }

  await addDoc(collection(db, "estoque"), {
    categoria,
    item,
    qtd,
    data,
    timestamp: new Date()
  });

  alert("Estoque registrado!");

  gerarBotaoPDF_Automatico();
});

// ======================================
// SALVAR ENTREGA MANUAL
// ======================================
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

// ======================================
// PDF – Botão fixo
// ======================================
document.getElementById("btnGerarPDF")?.addEventListener("click", gerarPDF);

// ======================================
// PDF – Botão Automático
// ======================================
function gerarBotaoPDF_Automatico() {
  const div = document.getElementById("pdfAutoContainer");
  div.innerHTML = `
    <button id="btnGerarPDFauto" class="admin-btn pdf-btn">
      📄 Gerar PDF – Estoque do Dia
    </button>
  `;

  document.getElementById("btnGerarPDFauto").addEventListener("click", gerarPDF);
}

// ======================================
// FUNÇÃO GERAL DO PDF
// ======================================
async function gerarPDF() {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  const snap = await getDocs(collection(db, "estoque"));

  let y = 15;

  pdf.setFontSize(18);
  pdf.text("Estoque do Dia – DFL", 14, y);
  y += 10;

  let ultimoDia = "";

  snap.forEach((docu) => {
    const e = docu.data();

    if (ultimoDia !== e.data) {
      y += 6;
      pdf.setFontSize(16);
      pdf.text("Data: " + e.data, 14, y);
      y += 8;
      ultimoDia = e.data;
    }

    pdf.setFontSize(13);
    pdf.text(`• ${e.categoria} – ${e.item}: ${e.qtd}`, 14, y);
    y += 7;

    if (y > 280) {
      pdf.addPage();
      y = 15;
    }
  });

  pdf.save("estoque-dfl.pdf");
}