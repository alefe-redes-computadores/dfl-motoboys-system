// ===============================
// 🔥 AUTH.JS — VERSÃO BLINDADA
// Admin + Motoboy (Rodrigo)
// ===============================

import { auth } from "./firebase-config-v2.js";

import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

// ===============================
// 🔐 UIDs DE ADMINISTRADORES
// ===============================
const ADMINS = [
  "6YczX4gLpUStlBVdQOXWc3uEYGG2",
  "LYu3M8gyRdMCqhE90vmH9Jh5Ksj1",
  "plSHKV043gTpEYfx7I3TI6FsJG93",
  "zIfbMxD1SQNvtlX9y6YUsEz2TXC3"
];

// ===============================
// 🛵 UID DO MOTOBOY (Rodrigo)
// ===============================
const MOTOBOY_RODRIGO_UID = "OU5MhGKctxea47kqtrCioNeRdZ73";

// ===============================
// 📍 Helpers
// ===============================
const isLoginPage = () =>
  location.pathname.endsWith("index.html") ||
  location.pathname === "/" ||
  location.pathname === "";

// ===============================
// 🚀 CONTROLE GLOBAL DE SESSÃO
// ===============================
onAuthStateChanged(auth, async (user) => {
  const path = location.pathname;

  // ❌ NÃO LOGADO
  if (!user) {
    // Se tentar acessar dashboard sem login → volta pro login
    if (!isLoginPage()) {
      window.location.replace("index.html");
    }
    return;
  }

  // 🔐 ADMIN
  if (ADMINS.includes(user.uid)) {
    if (!path.includes("dashboard-admin.html")) {
      window.location.replace("dashboard-admin.html");
    }
    return;
  }

  // 🛵 MOTOBOY
  if (user.uid === MOTOBOY_RODRIGO_UID) {
    if (!path.includes("dashboard.html")) {
      window.location.replace("dashboard.html");
    }
    return;
  }

  // ❌ USUÁRIO NÃO AUTORIZADO
  alert("Usuário sem permissão de acesso.");
  await signOut(auth);
  window.location.replace("index.html");
});

// ===============================
// 📌 LOGIN
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

    // 🔐 ADMIN
    if (ADMINS.includes(user.uid)) {
      window.location.replace("dashboard-admin.html");
      return;
    }

    // 🛵 MOTOBOY
    if (user.uid === MOTOBOY_RODRIGO_UID) {
      window.location.replace("dashboard.html");
      return;
    }

    // ❌ FALLBACK
    alert("Usuário sem permissão de acesso.");
    await signOut(auth);
    window.location.replace("index.html");

  } catch (err) {
    console.error(err);
    errorBox.innerText = "E-mail ou senha incorretos.";
    errorBox.style.display = "block";
  }
});