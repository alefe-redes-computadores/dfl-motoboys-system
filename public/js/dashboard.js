// ============================================================
// 🛵 Painel Motoboy – DFL
// Rodrigo Gonçalves (VERSÃO FINAL ESTÁVEL)
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
  const el = document.getElementById("saldoAtual");

  if (el) {
    el.textContent = `R$ ${saldo.toFixed(2).replace(".", ",")}`;
  }
}

// ============================================================
// 🧮 CÁLCULO DE GANHO (REGRA RODRIGO)
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
    const entregasInput = document.getElementById("entregas");
    const dinheiroInput = document.getElementById("dinheiro");
    const consumoInput  = document.getElementById("consumo");

    const entregas = Number(entregasInput?.value || 0);
    const dinheiro = Number(dinheiroInput?.value || 0);
    const consumo  = Number(consumoInput?.value || 0);

    if (entregas <= 0) {
      alert("Informe a quantidade de entregas.");
      return;
    }

    const ganho = calcularGanho(entregas);
    const saldoDia = ganho - dinheiro - consumo;

    const ref = doc(db, "motoboys", MOTOBOY_ID);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      alert("Motoboy não encontrado.");
      return;
    }

    const saldoAnterior = Number(snap.data().saldo || 0);
    const saldoFinal = saldoAnterior + saldoDia;

    // Atualiza saldo acumulado
    await updateDoc(ref, { saldo: saldoFinal });

    // Salva histórico (BASE DO PDF)
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

    // Atualiza tela
    await carregarSaldoAtual();
    await carregarHistorico();

    // Limpa campos
    if (entregasInput) entregasInput.value = "";
    if (dinheiroInput) dinheiroInput.value = "";
    if (consumoInput) consumoInput.value = "";

  } catch (e) {
    console.error(e);
    alert("Erro ao salvar fechamento.");
  }
});

// ============================================================
// 📊 HISTÓRICO DO MOTOBOY
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
// 📄 BOTÃO PDF DO DIA
// ============================================================
document.getElementById("btnGerarPdf")?.addEventListener("click", () => {
  window.open("/pdf-motoboy.html", "_blank");
});