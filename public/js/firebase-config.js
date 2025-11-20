// ===============================
// 🔥 Firebase Config - DFL Painel
// ===============================

import { initializeApp } from "firebase/app";
import {
  getAuth
} from "firebase/auth";

import {
  getFirestore
} from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyBOuIdV4uhDtCXmJQzKdrLEjZEk5LB98Zc",
  authDomain: "dfl-painel.firebaseapp.com",
  projectId: "dfl-painel",
  storageBucket: "dfl-painel.appspot.com",
  messagingSenderId: "773967662232",
  appId: "1:773967662232:web:f125e02ebdfcd069d94ed"
};

// Inicializar Firebase
export const app = initializeApp(firebaseConfig);

// Authentication
export const auth = getAuth(app);

// Firestore
export const db = getFirestore(app);
