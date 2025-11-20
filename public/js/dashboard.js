// =======================================
// 📊 Painel Motoboy – DFL
// =======================================

import { auth, db } from "./firebase-config.js";
import {
  signOut,
  onAuthStateChanged
} from "firebase/auth";

import {
  doc,
  updateDoc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs
} from "firebase/firestore";

// ID fixo do motoboy
const MOTOBOY_ID = "lucas_hiago";

// Botão sair
document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// Verificar login
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
  } else {
    carregarSaldo();
    carregarGrafico();
  }
});

// ===========================
// 🔹 Atualizar saldo na tela
// ===========================
async function carregarSaldo() {
  const snap = await getDoc(doc(db, "motoboys", MOTOBOY_ID));
  const dados = snap.data();
  document.getElementById("saldoAtual").innerText =
    "R$ " + dados.saldo.toFixed(2).replace(".", ",");
}

// ===========================
// 🔹 Registrar fechamento
// ===========================
document.getElementById("btnSalvar")?.addEventListener("click", async () => {

  const entregas = Number(document.getElementById("entregas").value);
  const dinheiro = Number(document.getElementById("dinheiro").value);
  const consumo  = Number(document.getElementById("consumo").value);

  const motoboyRef = doc(db, "motoboys", MOTOBOY_ID);
  const mbSnap = await getDoc(motoboyRef);
  const dadosMB = mbSnap.data();

  const saldoAnterior = dadosMB.saldo;
  const ganhoEntregas = entregas * dadosMB.taxaEntrega;

  const saldoFinal = saldoAnterior + ganhoEntregas - dinheiro - consumo;

  await updateDoc(motoboyRef, {
    saldo: saldoFinal
  });

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

  alert("Registro salvo!");
  carregarSaldo();
  carregarGrafico();
});

// ===========================
// 🔹 Gráfico Chart.js
// ===========================
async function carregarGrafico() {
  const q = query(collection(db, "historico"), where("motoboyid", "==", MOTOBOY_ID));
  const snap = await getDocs(q);

  let datas = [];
  let valores = [];

  snap.forEach((d) => {
    datas.push(d.data().data);
    valores.push(d.data().saldoFinal);
  });

  // ordenar por data
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
        borderColor: "#ffb400",
        backgroundColor: "rgba(255,180,0,0.3)",
        borderWidth: 3
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
