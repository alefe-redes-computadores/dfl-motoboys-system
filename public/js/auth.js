// public/js/auth.js
// Lida com login no "DFL – Painel do Motoboy"

// ==========================================
// 1. Imports do Firebase via CDN (ES Modules)
// ==========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// ==========================================
// 2. Configuração do Firebase (seus dados)
// ==========================================

const firebaseConfig = {
  apiKey: "AIzaSyBOuIdV4uhDtCXmJQzKdrLEjZEk5LB98Zc",
  authDomain: "dfl-painel.firebaseapp.com",
  projectId: "dfl-painel",
  storageBucket: "dfl-painel.firebasestorage.app",
  messagingSenderId: "773967662232",
  appId: "1:773967662232:web:f125e02ebdfcd069d94ed",
};

// Inicializa app, Auth e Firestore
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ==========================================
// 3. Helpers de UI
// ==========================================

const form = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const errorBox = document.getElementById("login-error");
const loginButton = document.getElementById("login-button");

// Criar overlay de loading (caso não exista por algum motivo)
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

// ==========================================
// 4. Verificar sessão já aberta
// ==========================================

onAuthStateChanged(auth, (user) => {
  // Se já estiver logado, manda direto para o painel
  if (user && window.location.pathname.endsWith("index.html")) {
    window.location.href = "dashboard.html";
  }
});

// ==========================================
// 5. Lógica de login
// ==========================================

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearError();

    const email = emailInput?.value.trim();
    const password = passwordInput?.value;

    if (!email || !password) {
      showError("Preencha e-mail e senha para continuar.");
      return;
    }

    try {
      setLoading(true);

      // Autentica usuário
      const credentials = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = credentials.user;

      // (Opcional) checar se é motoboy ativo no Firestore
      // Exemplo de como fazer isso, usando o e-mail:
      // try {
      //   const userDocRef = doc(db, "usuariosPainel", user.uid);
      //   const snap = await getDoc(userDocRef);
      //   if (snap.exists()) {
      //     const data = snap.data();
      //     if (data.ativo === false) {
      //       throw new Error("Seu usuário está inativo no painel.");
      //     }
      //   }
      // } catch (_) {
      //   // Se der erro aqui, deixamos passar por enquanto. Podemos refinar depois.
      // }

      // Sucesso: redireciona para painel
      window.location.href = "dashboard.html";
    } catch (error) {
      console.error("[DFL-Painel] Erro ao fazer login:", error);

      let message =
        "Não foi possível entrar. Verifique seu e-mail e senha e tente novamente.";

      if (error.code === "auth/invalid-credential") {
        message = "E-mail ou senha inválidos.";
      } else if (error.code === "auth/user-not-found") {
        message = "Usuário não encontrado.";
      } else if (error.code === "auth/wrong-password") {
        message = "Senha incorreta.";
      } else if (error.code === "auth/network-request-failed") {
        message =
          "Falha de conexão com o servidor. Confira sua internet e tente de novo.";
      }

      showError(message);
    } finally {
      setLoading(false);
    }
  });
}