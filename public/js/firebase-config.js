// ============================================================
// 🔥 Firebase Config – DFL Painel do Motoboy
// Arquivo ÚNICO responsável por inicializar o Firebase
// ============================================================

// Importa Firebase (versão CDN modular)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// ⚠️ Use EXATAMENTE os dados mostrados no Firebase Console → App da Web "dfl-painel"
const firebaseConfig = {
  apiKey: "AIzaSyB0uv4bUhtDCk3nJg2KdrLEjZEkSL98Zc",
  authDomain: "dfl-painel.firebaseapp.com",
  projectId: "dfl-painel",
  storageBucket: "dfl-painel.appspot.com",
  messagingSenderId: "773967662232",
  appId: "1:773967662232:web:f125e02bef0cd060d90d9aed"
};

// Inicializa Firebase (somente 1 vez)
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);