// ===============================
// 🔥 AUTH.JS — Versão Final Corrigida
// ===============================

import { auth } from "./firebase-config-v2.js";

import {
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

// ===============================
// 🔐 UIDs de administradores
// ===============================
const ADMINS = [
  "6YczX4gLpUStlBVdQOXWc3uEYGG2",
  "LYu3M8gyRdMCqhE90vmH9Jh5Ksj1",
  "plSHKV043gTpEYfx7I3TI6FsJG93",
  "zIfbMxD1SQNvtlX9y6YUsEz2TXC3"
];

// ===============================
// 🚀 Redirecionamento automático
// ===============================
onAuthStateChanged(auth, (user) => {
  if (!user) return; // não está logado → fica na tela de login

  if (ADMINS.includes(user.uid)) {
    window.location.href = "dashboard-admin.html";
  } else {
    window.location.href = "dashboard.html";
  }
});

// ===============================
// 📌 LOGIN DO USUÁRIO
// ===============================
document.getElementById("login-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const pass  = document.getElementById("password").value.trim();
  const errorBox = document.getElementById("login-error");

  try {
    errorBox.style.display = "none";

    const cred = await signInWithEmailAndPassword(auth, email, pass);
    const user = cred.user;

    // Redireciona imediatamente após login
    if (ADMINS.includes(user.uid)) {
      window.location.href = "dashboard-admin.html";
    } else {
      window.location.href = "dashboard.html";
    }

  } catch (err) {
    console.error(err);
    errorBox.innerText = "E-mail ou senha incorretos.";
    errorBox.style.display = "block";
  }
});