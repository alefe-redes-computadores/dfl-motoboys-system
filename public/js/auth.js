// public/js/auth.js
// Lida com login no “DFL – Painel do Motoboy”

// ===============================================
// 1. Importa app, auth, db da configuração única
// ===============================================
import { app, auth, db } from "./firebase-config-v2.js";

import {
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// ===============================================
// 2. Helpers de UI
// ===============================================

const form = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const errorBox = document.getElementById("login-error");
const loginButton = document.getElementById("login-button");

// Overlay de loading
let overlay;
function ensureOverlay() {
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "motopanel-overlay";
    overlay.innerHTML = `<div class="motopanel-overlay"><div class="motopanel-spinner"></div></div>`;
    document.body.appendChild(overlay);
  }
}

function setLoading(isLoading) {
  ensureOverlay();
  if (isLoading) {
    overlay.classList.add("show");
    loginButton.disabled = true;
  } else {
    overlay.classList.remove("show");
    loginButton.disabled = false;
  }
}

function showError(message) {
  if (!errorBox) return;
  errorBox.textContent = message;
  errorBox.style.display = "block";
}

function clearError() {
  if (!errorBox) return;
  errorBox.textContent = "";
  errorBox.style.display = "none";
}

// ===============================================
// 3. Se já estiver logado, manda direto pro painel
// ===============================================
onAuthStateChanged(auth, (user) => {
  if (user && window.location.pathname.endsWith("index.html")) {
    window.location.href = "dashboard.html";
  }
});

// ===============================================
// 4. Lógica de login
// ===============================================
if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearError();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showError("Preencha e-mail e senha para continuar.");
      return;
    }

    try {
      setLoading(true);

      // Autentica no Firebase Auth
      const credentials = await signInWithEmailAndPassword(auth, email, password);
      const user = credentials.user;

      // Verifica se o usuário está liberado no painel
      try {
        const userDocRef = doc(db, "usuariosPainel", user.uid);
        const snap = await getDoc(userDocRef);

        if (!snap.exists()) {
          throw new Error("Usuário não cadastrado no painel.");
        }

        const data = snap.data();

        if (!data.ativo) {
          throw new Error("Seu usuário está inativo no painel.");
        }

      } catch (checkError) {
        console.error("Erro ao checar usuariosPainel:", checkError);
        showError(checkError.message || "Erro ao validar acesso.");
        setLoading(false);
        return;
      }

      // Login OK → redireciona
      window.location.href = "dashboard.html";

    } catch (error) {
      console.error("Erro ao fazer login:", error);

      let message = "Não foi possível entrar. Verifique seu e-mail e senha.";
      if (error.code) message += ` (${error.code})`;

      showError(message);
      setLoading(false);
    }
  });
}