// ============================================================
// 🛵 Painel Motoboy – DFL
// Rodrigo Gonçalves (VERSÃO FINAL)
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
// 💰 SALDO
// ============================================================
async function carregarSaldoAtual() {
  const snap = await getDoc(doc(db, "motoboys", MOTOBOY_ID));
  if (!snap.exists()) return;

  document.getElementById("saldoAtual").textContent =
    `R$ ${Number(snap.data().saldo || 0).toFixed(2).replace(".", ",")}`;
}

// ============================================================
// 🧮 CÁLCULO
// ============================================================
function calcularGanho(entregas) {
  if (entregas <= 10) return 100;
  return 100 + (entregas - 10) * 7;
}

// ============================================================
// 🧾 FECHAMENTO
// ============================================================
document.getElementById("btnSalvar")?.addEventListener("click", async () => {
  const entregas = Number(entregasInput.value || 0);
  const dinheiro = Number(dinheiroInput.value || 0);
  const consumo  = Number(consumoInput.value || 0);

  if (entregas <= 0) {
    alert("Informe as entregas");
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
    data: new Date().toISOString().slice(0,10),
    entregas,
    ganhoEntregas: ganho,
    dinheiroRecebido: dinheiro,
    consumo,
    saldoDoDia: saldoDia,
    saldoAnterior,
    saldoFinal,
    timestamp: Date.now()
  });

  alert("Fechamento salvo!");
  carregarSaldoAtual();
  carregarHistorico();
});

// ============================================================
// 📊 HISTÓRICO
// ============================================================
async function carregarHistorico() {
  const lista = document.getElementById("listaHistorico");
  lista.innerHTML = "";

  const q = query(
    collection(db, "historicoMotoboy"),
    where("motoboyId", "==", MOTOBOY_ID),
    orderBy("timestamp", "desc")
  );

  const snap = await getDocs(q);

  snap.forEach(d => {
    const x = d.data();
    lista.innerHTML += `
      <div class="historico-item">
        <strong>${x.data}</strong><br>
        Entregas: ${x.entregas}<br>
        Saldo do dia: R$ ${x.saldoDoDia.toFixed(2).replace(".", ",")}
      </div>
    `;
  });
}

// ============================================================
// 📄 BOTÃO PDF (FALTAVA ISSO)
// ============================================================
document.getElementById("btnGerarPdf")?.addEventListener("click", () => {
  window.open("/pdf-motoboy.html", "_blank");
});