// ===============================================
// 🔒 Lida com login no "DFL – Painel do Motoboy"
// ===============================================

// Importa Firebase já inicializado
import { auth, db } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// ===============================================
// Helpers de UI
// ===============================================
const form = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("login-button");
const errorBox = document.getElementById("login-error");

// Criar overlay de loading caso não exista
let overlay = document.getElementById("motopanel-overlay");
if (!overlay) {
  overlay = document.createElement("div");
  overlay.id = "motopanel-overlay";
  overlay.className = "motopanel-overlay";
  overlay.innerHTML = `<div class="motopanel-spinner"></div>`;
  document.body.appendChild(overlay);
}

function setLoading(isLoading) {
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
// Verificar sessão ativa
// ===============================================
onAuthStateChanged(auth, (user) => {
  if (user && window.location.pathname.endsWith("index.html")) {
    window.location.href = "dashboard.html";
  }
});

// ===============================================
// Lógica de login
// ===============================================
if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearError();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showError("Preencha o e-mail e a senha para continuar.");
      return;
    }

    try {
      setLoading(true);

      // Autentica usuário
      const credentials = await signInWithEmailAndPassword(auth, email, password);
      const user = credentials.user;

      // (Opcional) validar se consta na coleção "usuariosPainel"
      try {
        const userDoc = doc(db, "usuariosPainel", user.email);
        const snap = await getDoc(userDoc);

        if (!snap.exists()) {
          throw new Error("Usuário não autorizado neste painel.");
        }
      } catch (e) {}

      // Sucesso → ir para dashboard
      window.location.href = "dashboard.html";

    } catch (error) {
      console.error("[DFL-Painel] Erro no login:", error);

      let message = "Não foi possível entrar. Verifique seu e-mail e senha.";

      if (error.code === "auth/invalid-credential") {
        message = "E-mail ou senha inválidos.";
      } else if (error.code === "auth/user-not-found") {
        message = "Usuário não encontrado.";
      } else if (error.code === "auth/wrong-password") {
        message = "Senha incorreta.";
      } else if (error.code === "auth/network-request-failed") {
        message = "Falha de conexão com o servidor. Tente novamente.";
      }

      showError(message);

    } finally {
      setLoading(false);
    }
  });
}