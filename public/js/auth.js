// /public/js/auth.js
// Lida com login no “DFL – Painel do Motoboy”

// ============================================
// 1. Imports do Firebase via CDN
// ============================================
import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";


// ============================================
// 2. Configuração do Firebase
// ============================================
import {
  app,
  auth,
  db
} from "./firebase-config.js";


// ============================================
// 3. Helpers de UI
// ============================================
const form = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const errorBox = document.getElementById("login-error");
const loginButton = document.getElementById("login-button");

function setLoading(isLoading) {
  const overlay = document.querySelector(".motopanel-overlay");
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


// ============================================
// 4. Verificar se sessão já está aberta
// ============================================
onAuthStateChanged(auth, (user) => {
  if (user && window.location.pathname.endsWith("index.html")) {
    window.location.href = "dashboard.html";
  }
});


// ============================================
// 5. Lógica de Login
// ============================================
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

      // --- 1) Autentica no Firebase Auth ---
      const credentials = await signInWithEmailAndPassword(auth, email, password);
      const user = credentials.user;

      // --- 2) Checar se o usuário existe na coleção usuariosPanel ---
      const userRef = doc(db, "usuariosPanel", user.uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        throw new Error("Usuário não encontrado no painel.");
      }

      const data = snap.data();

      if (!data.ativo) {
        throw new Error("Seu usuário está inativo no painel.");
      }

      if (!["admin", "motoboy"].includes(data.tipo)) {
        throw new Error("Tipo de usuário inválido.");
      }

      // --- 3) OK → Redirecionar ---
      window.location.href = "dashboard.html";

    } catch (error) {

      let message = "Não foi possível entrar. Verifique seu e-mail e senha.";

      if (error.code === "auth/invalid-credential") {
        message = "E-mail ou senha inválidos.";
      }
      if (error.message.includes("inativo")) {
        message = "Seu usuário está inativo.";
      }
      if (error.message.includes("não encontrado")) {
        message = "E-mail não tem acesso ao painel.";
      }

      showError(message);
      console.error("[DFL-Painel] Erro:", error);

    } finally {
      setLoading(false);
    }
  });
}