// public/js/dashboard.js
// =======================================
// 📊 Painel Motoboy – DFL
// =======================================

// Importa auth e db da mesma config usada no login
import { auth, db } from "./firebase-config-v2.js";

// Importa Auth e Firestore via CDN (mesma versão)
import {
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

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

// ID fixo do motoboy
const MOTOBOY_ID = "lucas_hiago";

// Botão sair
document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (e) {
    console.error("Erro ao deslogar:", e);
  }
  window.location.href = "index.html";
});

// Verificar login
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    // Se não estiver autenticado, volta para o login
    window.location.href = "index.html";
  } else {
    // Se estiver logado, carrega dados do painel
    try {
      await carregarSaldo();
      await carregarGrafico();
    } catch (e) {
      console.error("Erro ao carregar painel:", e);
    }
  }
});

// ===========================
// 🔹 Atualizar saldo na tela
// ===========================
async function carregarSaldo() {
  const snap = await getDoc(doc(db, "motoboys", MOTOBOY_ID));

  if (!snap.exists()) {
    console.warn("Motoboy não encontrado na coleção motoboys.");
    return;
  }

  const dados = snap.data();
  const saldo = Number(dados.saldo || 0);

  const elemSaldo = document.getElementById("saldoAtual");
  if (elemSaldo) {
    elemSaldo.innerText = "R$ " + saldo.toFixed(2).replace(".", ",");
  }
}

// ===========================
// 🔹 Registrar fechamento
// ===========================
document.getElementById("btnSalvar")?.addEventListener("click", async () => {
  try {
    const entregas = Number(document.getElementById("entregas").value || 0);
    const dinheiro = Number(document.getElementById("dinheiro").value || 0);
    const consumo  = Number(document.getElementById("consumo").value || 0);

    const motoboyRef = doc(db, "motoboys", MOTOBOY_ID);
    const mbSnap = await getDoc(motoboyRef);

    if (!mbSnap.exists()) {
      alert("Motoboy não encontrado na base de dados.");
      return;
    }

    const dadosMB = mbSnap.data();

    const saldoAnterior = Number(dadosMB.saldo || 0);
    const taxaEntrega = Number(dadosMB.taxaEntrega || 0);
    const ganhoEntregas = entregas * taxaEntrega;

    const saldoFinal = saldoAnterior + ganhoEntregas - dinheiro - consumo;

    // Atualiza saldo do motoboy
    await updateDoc(motoboyRef, {
      saldo: saldoFinal
    });

    // Registra histórico do dia
    await addDoc(collection(db, "historico"), {
      motoboyid: MOTOBOY_ID,
      data: new Date().toISOString().split("T")[0],
      entregas,
      dinheiroRecebido: dinheiro,
      consumo,
      saldoAnterior,
      saldoFinal,
      timestamp: new Date()
    });

    alert("Registro salvo com sucesso!");
    await carregarSaldo();
    await carregarGrafico();

  } catch (e) {
    console.error("Erro ao salvar registro:", e);
    alert("Erro ao salvar registro. Tente novamente.");
  }
});

// ===========================
// 🔹 Gráfico Chart.js
// ===========================
async function carregarGrafico() {
  const q = query(
    collection(db, "historico"),
    where("motoboyid", "==", MOTOBOY_ID)
  );
  const snap = await getDocs(q);

  let datas = [];
  let valores = [];

  snap.forEach((d) => {
    const dado = d.data();
    datas.push(dado.data);
    valores.push(Number(dado.saldoFinal || 0));
  });

  // Ordena por data (string ISO yyyy-mm-dd)
  const combinado = datas.map((d, i) => ({ d, v: valores[i] }))
    .sort((a, b) => a.d.localeCompare(b.d));

  datas = combinado.map(x => x.d);
  valores = combinado.map(x => x.v);

  const ctx = document.getElementById("graficoSaldo");
  if (!ctx) {
    console.warn("Elemento #graficoSaldo não encontrado.");
    return;
  }

  // eslint-disable-next-line no-undef
  new Chart(ctx, {
    type: "line",
    data: {
      labels: datas,
      datasets: [{
        label: "Saldo Final (R$)",
        data: valores,
        borderColor: "#ffb400",
        backgroundColor: "rgba(255,180,0,0.3)",
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