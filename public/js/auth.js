// ===============================
// 🔥 AUTH.JS — VERSÃO ANDROID SAFE
// ===============================

import { auth } from "./firebase-config-v2.js";

import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

// ===============================
// 🔐 UIDs DE ADMIN
// ===============================
const ADMINS = [
  "6YczX4gLpUStlBVdQOXWc3uEYGG2",
  "LYu3M8gyRdMCqhE90vmH9Jh5Ksj1",
  "plSHKV043gTpEYfx7I3TI6FsJG93",
  "zIfbMxD1SQNvtlX9y6YUsEz2TXC3"
];

// ===============================
// 🛵 UID MOTOBOY
// ===============================
const MOTOBOY_UID = "OU5MhGKctxea47kqtrCioNeRdZ73";

// ===============================
// 🧠 CONTROLE DE ESTADO
// ===============================
let authReady = false;

// ===============================
// 📍 Helpers
// ===============================
const page = location.pathname.split("/").pop();

const isLoginPage = () =>
  page === "" || page === "index.html";

const isAdminPage = () =>
  page === "dashboard-admin.html";

const isMotoboyPage = () =>
  page === "dashboard.html";

// ===============================
// 🚀 AUTH STATE (BLINDADO)
// ===============================
onAuthStateChanged(auth, async (user) => {
  if (!authReady) {
    authReady = true;
  }

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
  if (user.uid === MOTOBOY_UID) {
    if (!isMotoboyPage()) {
      location.replace("dashboard.html");
    }
    return;
  }

  // ❌ USUÁRIO SEM PERMISSÃO
  alert("Usuário sem permissão.");
  await signOut(auth);
  location.replace("index.html");
});

// ===============================
// 📌 LOGIN
// ===============================
document.getElementById("login-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const pass = document.getElementById("password").value.trim();
  const errorBox = document.getElementById("login-error");

  try {
    errorBox.style.display = "none";

    const cred = await signInWithEmailAndPassword(auth, email, pass);
    const user = cred.user;

    if (ADMINS.includes(user.uid)) {
      location.replace("dashboard-admin.html");
      return;
    }

    if (user.uid === MOTOBOY_UID) {
      location.replace("dashboard.html");
      return;
    }

    alert("Usuário sem permissão.");
    await signOut(auth);
    location.replace("index.html");

  } catch (err) {
    console.error(err);
    errorBox.innerText = "E-mail ou senha inválidos.";
    errorBox.style.display = "block";
  }
});