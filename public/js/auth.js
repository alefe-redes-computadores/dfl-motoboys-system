// ===============================
// 🔥 AUTH.JS — VERSÃO FINAL ANTI-LOOP
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
// 📍 HELPERS
// ===============================
const page = () => location.pathname.split("/").pop() || "index.html";

const isLoginPage = () => page() === "index.html";
const isAdminPage = () => page() === "dashboard-admin.html";
const isMotoboyPage = () => page() === "dashboard.html";

// ===============================
// 🔐 PROTEÇÃO DE ROTAS (ANTI-LOOP)
// ===============================
onAuthStateChanged(auth, async (user) => {

  // ❌ NÃO LOGADO
  if (!user) {
    if (!isLoginPage()) {
      location.replace("index.html");
    }
    return;
  }

  // 🔐 ADMIN
  if (ADMINS.includes(user.uid)) {
    if (!isAdminPage()) {
      location.replace("dashboard-admin.html");
    }
    return;
  }

  // 🛵 MOTOBOY
  if (user.uid === MOTOBOY_RODRIGO_UID) {
    if (!isMotoboyPage()) {
      location.replace("dashboard.html");
    }
    return;
  }

  // ❌ USUÁRIO NÃO AUTORIZADO
  alert("Usuário sem permissão de acesso.");
  await signOut(auth);
  location.replace("index.html");
});

// ===============================
// 📌 LOGIN (REDIRECT UMA ÚNICA VEZ)
// ===============================
document.getElementById("login-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email")?.value.trim();
  const pass  = document.getElementById("password")?.value.trim();
  const errorBox = document.getElementById("login-error");

  try {
    if (errorBox) errorBox.style.display = "none";

    const cred = await signInWithEmailAndPassword(auth, email, pass);
    const user = cred.user;

    // 🔐 ADMIN
    if (ADMINS.includes(user.uid)) {
      location.href = "dashboard-admin.html";
      return;
    }

    // 🛵 MOTOBOY
    if (user.uid === MOTOBOY_RODRIGO_UID) {
      location.href = "dashboard.html";
      return;
    }

    // ❌ FALLBACK
    alert("Usuário sem permissão de acesso.");
    await signOut(auth);
    location.replace("index.html");

  } catch (err) {
    console.error(err);
    if (errorBox) {
      errorBox.innerText = "E-mail ou senha incorretos.";
      errorBox.style.display = "block";
    }
  }
});