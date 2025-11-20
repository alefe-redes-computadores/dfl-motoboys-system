// ===============================
// 🔥 Firebase Config - DFL Painel
// Versão para site estático (CDN)
// ===============================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth }         from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getFirestore }    from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

export const firebaseConfig = {
  apiKey: "AIzaSyBOuIdV4uhDtCXmJQzKdrLEjZEk5LB98Zc",
  authDomain: "dfl-painel.firebaseapp.com",
  projectId: "dfl-painel",
  storageBucket: "dfl-painel.appspot.com",
  messagingSenderId: "773967662232",
  appId: "1:773967662232:web:f125e02ebdfcd069d94ed"
};

// Inicializar Firebase
export const app  = initializeApp(firebaseConfig);

// Authentication
export const auth = getAuth(app);

// Firestore
export const db   = getFirestore(app);