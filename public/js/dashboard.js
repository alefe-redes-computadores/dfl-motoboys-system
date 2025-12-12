// ============================================================
// 🛵 Painel Motoboy – DFL
// Rodrigo Gonçalves (VERSÃO FINAL + PAGAMENTO)
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
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// ============================================================
// ⚙️ CONFIG
// ============================================================
const MOTOBOY_ID = "rodrigo_goncalves";

// ============================================================
// 🚪 LOGOUT
// ============================================================
document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// ============================================================
// 🔐 AUTH
// ============================================================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  await carregarSaldoAtual();
  await carregarHistorico();
});

// ============================================================
// 💰 SALDO ATUAL (ACUMULADO)
// ============================================================
async function carregarSaldoAtual() {
  const ref = doc(db, "motoboys", MOTOBOY_ID);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const saldo = Number(snap.data().saldo || 0);
  document.getElementById("saldoAtual").textContent =
    `R$ ${saldo.toFixed(2).replace(".", ",")}`;
}

// ============================================================
// 🧮 REGRA DE GANHO
// ============================================================
function calcularGanho(entregas) {
  if (entregas <= 0) return 0;
  if (entregas <= 10) return 100;
  return 100 + (entregas - 10) * 7;
}

// ============================================================
// 🧾 FECHAMENTO DO DIA
// ============================================================
document.getElementById("btnSalvar")?.addEventListener("click", async () => {
  try {
    const entregas = Number(document.getElementById("entregas")?.value || 0);
    const dinheiro = Number(document.getElementById("dinheiro")?.value || 0);
    const consumo  = Number(document.getElementById("consumo")?.value || 0);

    if (entregas <= 0) {
      alert("Informe a quantidade de entregas.");
      return;
    }

    const ganho = calcularGanho(entregas);
    const saldoDia = ganho - dinheiro - consumo;

    const ref = doc(db, "motoboys", MOTOBOY_ID);
    const snap = await getDoc(ref);

    const saldoAnterior = Number(snap.data().saldo || 0);
    const saldoFinal = saldoAnterior + saldoDia;

    await updateDoc(ref, { saldo: saldoFinal });

    await addDoc(collection(db, "historicoMotoboy"), {
      motoboyId: MOTOBOY_ID,
      data: new Date().toISOString().slice(0, 10),
      entregas,
      ganhoEntregas: ganho,
      dinheiroRecebido: dinheiro,
      consumo,
      saldoDoDia: saldoDia,
      saldoAnterior,
      saldoFinal,
      timestamp: Date.now()
    });

    alert("Fechamento salvo com sucesso!");
    await carregarSaldoAtual();
    await carregarHistorico();

    ["entregas","dinheiro","consumo"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });

  } catch (e) {
    console.error(e);
    alert("Erro ao salvar fechamento.");
  }
});

// ============================================================
// 📊 HISTÓRICO
// ============================================================
async function carregarHistorico() {
  const lista = document.getElementById("listaHistorico");
  if (!lista) return;

  lista.innerHTML = "<p>Carregando...</p>";

  const q = query(
    collection(db, "historicoMotoboy"),
    where("motoboyId", "==", MOTOBOY_ID),
    orderBy("timestamp", "desc")
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    lista.innerHTML = "<p>Nenhum registro.</p>";
    return;
  }

  let html = "";

  snap.forEach(d => {
    const x = d.data();
    html += `
      <div class="historico-item">
        <strong>${x.data}</strong><br>
        Entregas: ${x.entregas}<br>
        Ganho: R$ ${x.ganhoEntregas.toFixed(2).replace(".", ",")}<br>
        Dinheiro: R$ ${x.dinheiroRecebido.toFixed(2).replace(".", ",")}<br>
        Consumo: R$ ${x.consumo.toFixed(2).replace(".", ",")}<br>
        <strong>Saldo do dia: R$ ${x.saldoDoDia.toFixed(2).replace(".", ",")}</strong>
      </div>
    `;
  });

  lista.innerHTML = html;
}

// ============================================================
// 💵 PAGAMENTO DO MOTOBOY
// ============================================================
document.getElementById("btnAbrirPagamento")?.addEventListener("click", () => {
  document.getElementById("modalPagamento")?.classList.remove("hidden");
  document.getElementById("dataPagamento").value =
    new Date().toISOString().slice(0,10);
});

document.getElementById("cancelarPagamento")?.addEventListener("click", () => {
  document.getElementById("modalPagamento")?.classList.add("hidden");
});

document.getElementById("confirmarPagamento")?.addEventListener("click", async () => {
  try {
    const valor = Number(document.getElementById("valorPagamento")?.value || 0);
    const data  = document.getElementById("dataPagamento")?.value;

    if (valor <= 0) {
      alert("Informe um valor válido.");
      return;
    }

    const ref = doc(db, "motoboys", MOTOBOY_ID);
    const snap = await getDoc(ref);

    const saldoAnterior = Number(snap.data().saldo || 0);
    const saldoFinal = saldoAnterior - valor;

    await updateDoc(ref, { saldo: saldoFinal });

    await addDoc(collection(db, "pagamentosMotoboy"), {
      motoboyId: MOTOBOY_ID,
      valor,
      data,
      saldoAnterior,
      saldoFinal,
      timestamp: Date.now()
    });

    alert("Pagamento registrado com sucesso!");

    document.getElementById("modalPagamento")?.classList.add("hidden");
    document.getElementById("valorPagamento").value = "";

    await carregarSaldoAtual();

  } catch (e) {
    console.error(e);
    alert("Erro ao registrar pagamento.");
  }
});

// ============================================================
// 📄 PDF
// ============================================================
document.getElementById("btnGerarPdf")?.addEventListener("click", () => {
  window.open("/pdf-motoboy.html", "_blank");
});