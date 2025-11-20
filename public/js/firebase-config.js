// =====================================================
// 🔥 Firebase Config – DFL Painel do Motoboy
// ÚNICO arquivo responsável por inicializar o Firebase
// =====================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// ⚠️ Use exatamente os dados mostrados no Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyBOu1vdh0wDtCk3nJ2gKrlLEjZEk5L898zc",
  authDomain: "dfl-painel.firebaseapp.com",
  projectId: "dfl-painel",
  storageBucket: "dfl-painel.appspot.com",
  messagingSenderId: "777396766322",
  appId: "1:777396766322:web:f1229e0abfcd69009d9aed"
};

// 🚀 Inicializa Firebase (somente 1 vez)
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);