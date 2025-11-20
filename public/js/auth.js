// public/js/auth.js
// Lida com login no "DFL – Painel do Motoboy"

// ==============================================
// 1. Importa app, auth e db da configuração única
// ==============================================
import { app, auth, db } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// ==============================================
// 2. Helpers de UI
// ==============================================
const form = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const errorBox = document.getElementById("login-error");
const loginButton = document.getElementById("login-button");

// Cria/garante overlay de loading
let overlay = document.getElementById("motopanel-overlay");
if (!overlay) {
  overlay = document.createElement("div");
  overlay.id = "motopanel-overlay";
  overlay.className = "motopanel-overlay";
  overlay.innerHTML = '<div class="motopanel-spinner"></div>';
  document.body.appendChild(overlay);
}

function setLoading(isLoading) {
  if (isLoading) {
    overlay.classList.add("show");
    if (loginButton) loginButton.disabled = true;
  } else {
    overlay.classList.remove("show");
    if (loginButton) loginButton.disabled = false;
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

// ==============================================
// 3. Se já estiver logado, manda direto pro painel
// ==============================================
onAuthStateChanged(auth, (user) => {
  if (user && window.location.pathname.endsWith("index.html")) {
    window.location.href = "dashboard.html";
  }
});

// ==============================================
// 4. Lógica de login
// ==============================================
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

      // 🔐 Tenta autenticar
      const credentials = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = credentials.user;

      // (Opcional) Checar se o usuário está ativo na coleção usuariosPainel
      try {
        const userDocRef = doc(db, "usuariosPainel", user.uid);
        const snap = await getDoc(userDocRef);
        if (!snap.exists()) {
          throw new Error("Usuário não cadastrado no painel.");
        }
        const data = snap.data();
        if (data.ativo === false) {
          throw new Error("Seu usuário está inativo no painel.");
        }
      } catch (checkError) {
        console.error("[DFL Painel] Erro ao checar usuariosPainel:", checkError);
        // Se der erro aqui, mostramos na tela
        showError(checkError.message || "Erro ao validar permissão de acesso.");
        setLoading(false);
        return;
      }

      // ✅ Sucesso: vai para o painel
      window.location.href = "dashboard.html";
    } catch (error) {
      console.error("[DFL Painel] Erro ao fazer login:", error);

      let message =
        "Não foi possível entrar. Verifique seu e-mail e senha e tente novamente.";
      const code = error.code || "";

      // Mostra o código na mensagem para debug
      if (
        code === "auth/invalid-credential" ||
        code === "auth/user-not-found" ||
        code === "auth/wrong-password"
      ) {
        message =
          "E-mail ou senha inválidos. (código: " + code + ")";
      } else if (code) {
        message = "Erro técnico ao autenticar: " + code;
      }

      showError(message);
    } finally {
      setLoading(false);
    }
  });
}