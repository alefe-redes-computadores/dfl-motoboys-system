// ============================================
// 🔥 Firebase Config — DFL Painel do Motoboy
// Arquivo ÚNICO responsável pela inicialização
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// ⚠️ Use exatamente os dados mostrados no Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyBOuIdV4uhDtCXmJQzKdrLEjZEk5LB98Zc",
  authDomain: "dfl-painel.firebaseapp.com",
  projectId: "dfl-painel",
  storageBucket: "dfl-painel.appspot.com",
  messagingSenderId: "773967662232",
  appId: "1:773967662232:web:f125e02ebdfcd0690d94ed"
};

// 🔥 Inicializa Firebase (apenas 1 vez!)
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);