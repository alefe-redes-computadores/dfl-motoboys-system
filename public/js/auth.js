// =========================================================
// 🔐 Lógica de Login — DFL Painel do Motoboy
// =========================================================

// Importando Firebase A PARTIR DO SEU ARQUIVO CORRETAMENTE
import { auth, db } from "./firebase-config.js";

import {
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

// =================================================================
// 1. Referências da UI
// =================================================================
const form = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const errorBox = document.getElementById("login-error");
const loginButton = document.getElementById("login-button");

// =================================================================
// 2. Funções auxiliares
// =================================================================
function showLoading(state) {
  let overlay = document.getElementById("motopanel-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "motopanel-overlay";
    overlay.className = "motopanel-overlay";
    overlay.innerHTML = `<div class="motopanel-spinner"></div>`;
    document.body.appendChild(overlay);
  }
  overlay.classList[state ? "add" : "remove"]("show");
  loginButton.disabled = state;
}

function showError(msg) {
  if (!errorBox) return;
  errorBox.textContent = msg;
  errorBox.style.display = "block";
}

function clearError() {
  errorBox.style.display = "none";
  errorBox.textContent = "";
}

// =================================================================
// 3. Se o usuário já estiver logado → manda direto para painel
// =================================================================
onAuthStateChanged(auth, (user) => {
  if (user && window.location.pathname.endsWith("index.html")) {
    window.location.href = "dashboard.html";
  }
});

// =================================================================
// 4. Lógica de login
// =================================================================
if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearError();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      showError("Preencha e-mail e senha para continuar.");
      return;
    }

    try {
      showLoading(true);

      const credentials = await signInWithEmailAndPassword(auth, email, password);
      const user = credentials.user;

      // Login OK → envia para o painel
      window.location.href = "dashboard.html";

    } catch (error) {
      console.error("Erro de login:", error);

      let msg = "Não foi possível entrar. Verifique seu e-mail e senha.";

      if (error.code === "auth/invalid-credential") msg = "E-mail ou senha incorretos.";
      if (error.code === "auth/user-not-found") msg = "Usuário não encontrado.";
      if (error.code === "auth/wrong-password") msg = "Senha incorreta.";
      if (error.code === "auth/network-request-failed")
        msg = "Erro de conexão. Verifique sua internet.";

      showError(msg);
    } finally {
      showLoading(false);
    }
  });
}