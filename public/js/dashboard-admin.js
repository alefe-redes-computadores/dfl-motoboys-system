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

const ADMINS = [
  "6YczX4gLpUStlBVdQOXWc3uEYGG2",
  "LYu3M8gyRdMCqhE90vmH9Jh5Ksj1",
  "plSHKV043gTpEYfx7I3TI6FsJG93",
  "zIfbMxD1SQNvtlX9y6YUsEz2TXC3"
];

// =======================
// VERIFICA LOGIN
// =======================
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
});

// =======================
// LOGOUT
// =======================
document.getElementById("logoutAdmin")?.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// =======================
// CARREGAR SALDOS + LISTA
// =======================
async function carregarSaldosMotoboys() {
  const listaEl = document.getElementById("listaMotoboys");
  const saldoEl = document.getElementById("saldoGeral");

  listaEl.innerHTML = "Carregando...";

  const snap = await getDocs(collection(db, "motoboys"));

  let total = 0;
  let htmlLista = "";

  snap.forEach((docu) => {
    const dados = docu.data();
    const nome = dados.nome || docu.id;
    const saldo = Number(dados.saldo || 0);

    total += saldo;

    htmlLista += `
      <div class="motoboy-item">
        <strong>${nome}</strong> — 
        <span class="valor ${saldo > 0 ? 'negativo' : 'positivo'}">
          R$ ${saldo.toFixed(2).replace(".", ",")}
        </span>
      </div>
    `;
  });

  // Atualiza lista
  listaEl.innerHTML = htmlLista;

  // Atualiza o saldo total com cor
  saldoEl.innerText = "R$ " + total.toFixed(2).replace(".", ",");
  saldoEl.classList.remove("positivo", "negativo");

  if (total > 0) saldoEl.classList.add("negativo");  // valor a pagar
  else saldoEl.classList.add("positivo");
}