// =======================================
// 📊 Painel Motoboy – DFL
// =======================================

// Importa instâncias únicas do Firebase (iniciais no firebase-config.js)
import { auth, db } from "./firebase-config.js";

// Firebase Auth via CDN (versão correta)
import {
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

// Firebase Firestore via CDN (versão correta)
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

// ID do motoboy — por enquanto fixo (pode virar dinâmico futuramente)
const MOTOBOY_ID = "lucas_hiago";

// ----------------------------------------------------
// 🔹 Botão SAIR
// ----------------------------------------------------
document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// ----------------------------------------------------
// 🔹 Verificar login ao abrir o painel
// ----------------------------------------------------
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
  } else {
    carregarSaldo();
    carregarGrafico();
  }
});

// ----------------------------------------------------
// 🔹 Carregar saldo atual
// ----------------------------------------------------
async function carregarSaldo() {
  const snap = await getDoc(doc(db, "motoboys", MOTOBOY_ID));

  if (!snap.exists()) {
    console.error("Motoboy não encontrado na coleção.");
    return;
  }

  const dados = snap.data();

  document.getElementById("saldoAtual").innerText =
    "R$ " + Number(dados.saldo).toFixed(2).replace(".", ",");
}

// ----------------------------------------------------
// 🔹 Registrar fechamento diário
// ----------------------------------------------------
document.getElementById("btnSalvar")?.addEventListener("click", async () => {
  const entregas = Number(document.getElementById("entregas").value);
  const dinheiro = Number(document.getElementById("dinheiro").value);
  const consumo  = Number(document.getElementById("consumo").value);

  const motoboyRef = doc(db, "motoboys", MOTOBOY_ID);
  const mbSnap = await getDoc(motoboyRef);

  if (!mbSnap.exists()) {
    alert("Erro: motoboy não encontrado.");
    return;
  }

  const dadosMB = mbSnap.data();

  const saldoAnterior = dadosMB.saldo;
  const ganhoEntregas = entregas * dadosMB.taxaEntrega;

  // Novo saldo
  const saldoFinal = saldoAnterior + ganhoEntregas - dinheiro - consumo;

  // Atualiza saldo
  await updateDoc(motoboyRef, {
    saldo: saldoFinal
  });

  // Adiciona ao histórico
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
  carregarSaldo();
  carregarGrafico();
});

// ----------------------------------------------------
// 🔹 Gráfico (Chart.js)
// ----------------------------------------------------
async function carregarGrafico() {
  const q = query(collection(db, "historico"), where("motoboyid", "==", MOTOBOY_ID));
  const snap = await getDocs(q);

  let datas = [];
  let valores = [];

  snap.forEach((docSnap) => {
    const d = docSnap.data();
    datas.push(d.data);
    valores.push(d.saldoFinal);
  });

  // Ordenar por data
  const combinado = datas.map((d, i) => ({ d, v: valores[i] }))
    .sort((a, b) => a.d.localeCompare(b.d));

  datas = combinado.map(x => x.d);
  valores = combinado.map(x => x.v);

  new Chart(document.getElementById("graficoSaldo"), {
    type: "line",
    data: {
      labels: datas,
      datasets: [{
        label: "Saldo Final (R$)",
        data: valores,
        borderColor: "#ffca28",
        backgroundColor: "rgba(255,202,40,0.25)",
        borderWidth: 3,
        tension: 0.2
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: false
        }
      }
    }
  });
}