// ============================================================
// 📊 Painel Motoboy – DFL (VERSÃO ESTÁVEL E BLINDADA)
// NÃO INTERFERE NO PAGAMENTO DO ADMIN
// ============================================================

// Importa auth e db
import { auth, db } from "./firebase-config-v2.js";

// Firebase Auth
import {
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

// Firestore
import {
  doc,
  updateDoc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// ============================================================
// ⚙️ CONFIG
// ============================================================
const MOTOBOY_ID = "lucas_hiago";

// ============================================================
// 🚪 LOGOUT
// ============================================================
document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// ============================================================
// 🔐 AUTENTICAÇÃO
// ============================================================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  await carregarSaldo();
  await carregarGrafico();
});

// ============================================================
// 💰 CARREGAR SALDO ATUAL (APENAS LEITURA)
// ============================================================
async function carregarSaldo() {
  const snap = await getDoc(doc(db, "motoboys", MOTOBOY_ID));
  if (!snap.exists()) return;

  const saldo = Number(snap.data().saldo || 0);

  const el = document.getElementById("saldoAtual");
  if (el) {
    el.textContent = "R$ " + saldo.toFixed(2).replace(".", ",");
  }
}

// ============================================================
// 🧾 REGISTRAR FECHAMENTO DIÁRIO
// ⚠️ NÃO MEXE EM PAGAMENTO ADMIN
// ============================================================
document.getElementById("btnSalvar")?.addEventListener("click", async () => {
  try {
    const entregas = Number(document.getElementById("entregas").value || 0);
    const dinheiro = Number(document.getElementById("dinheiro").value || 0);
    const consumo  = Number(document.getElementById("consumo").value || 0);

    const ref = doc(db, "motoboys", MOTOBOY_ID);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      alert("Motoboy não encontrado.");
      return;
    }

    const dados = snap.data();
    const saldoAnterior = Number(dados.saldo || 0);
    const taxaEntrega = Number(dados.taxaEntrega || 6);

    // 👉 GANHO DO DIA
    const ganhoEntregas = entregas * taxaEntrega;

    // 👉 CÁLCULO FINAL
    const saldoFinal =
      saldoAnterior +
      ganhoEntregas -
      dinheiro -
      consumo;

    // 🔒 Atualiza saldo FINAL
    await updateDoc(ref, {
      saldo: saldoFinal
    });

    // 🧾 Histórico (APENAS REGISTRO)
    await addDoc(collection(db, "historico"), {
      motoboyid: MOTOBOY_ID,
      data: new Date().toISOString().split("T")[0],
      entregas,
      ganhoEntregas,
      dinheiroRecebido: dinheiro,
      consumo,
      saldoAnterior,
      saldoFinal,
      timestamp: Date.now()
    });

    alert("Fechamento registrado com sucesso!");

    await carregarSaldo();
    await carregarGrafico();

  } catch (e) {
    console.error("Erro no fechamento:", e);
    alert("Erro ao salvar fechamento.");
  }
});

// ============================================================
// 📈 GRÁFICO DE EVOLUÇÃO DO SALDO
// ============================================================
async function carregarGrafico() {
  const q = query(
    collection(db, "historico"),
    where("motoboyid", "==", MOTOBOY_ID)
  );

  const snap = await getDocs(q);

  if (snap.empty) return;

  let dados = [];

  snap.forEach(d => {
    const x = d.data();
    dados.push({
      data: x.data,
      valor: Number(x.saldoFinal || 0)
    });
  });

  // Ordena por data
  dados.sort((a, b) => a.data.localeCompare(b.data));

  const ctx = document.getElementById("graficoSaldo");
  if (!ctx) return;

  // eslint-disable-next-line no-undef
  new Chart(ctx, {
    type: "line",
    data: {
      labels: dados.map(d => d.data),
      datasets: [{
        label: "Saldo Final (R$)",
        data: dados.map(d => d.valor),
        borderColor: "#ffb400",
        backgroundColor: "rgba(255,180,0,0.25)",
        borderWidth: 3,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: false }
      }
    }
  });
}