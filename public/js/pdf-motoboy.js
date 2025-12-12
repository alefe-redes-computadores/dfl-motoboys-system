import { db } from "./firebase-config-v2.js";

import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  limit
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const MOTOBOY_ID = "rodrigo_goncalves";

async function gerarPDF() {
  const q = query(
    collection(db, "historicoMotoboy"),
    where("motoboyId", "==", MOTOBOY_ID),
    orderBy("timestamp", "desc"),
    limit(1)
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    alert("Nenhum registro encontrado.");
    return;
  }

  const dados = snap.docs[0].data();

  // Preenche HTML
  document.getElementById("pdfNome").textContent = "Rodrigo Gonçalves";
  document.getElementById("pdfData").textContent = dados.data;
  document.getElementById("pdfEntregas").textContent = dados.entregas;
  document.getElementById("pdfGanho").textContent =
    "R$ " + dados.ganhoEntregas.toFixed(2).replace(".", ",");
  document.getElementById("pdfDinheiro").textContent =
    "R$ " + dados.dinheiroRecebido.toFixed(2).replace(".", ",");
  document.getElementById("pdfConsumo").textContent =
    "R$ " + dados.consumo.toFixed(2).replace(".", ",");
  document.getElementById("pdfSaldo").textContent =
    "R$ " + dados.saldoDoDia.toFixed(2).replace(".", ",");

  // Gera PDF
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("p", "mm", "a4");

  await pdf.html(document.body, {
    callback: function (doc) {
      doc.save(`DFL_Rodrigo_${dados.data}.pdf`);
    },
    x: 10,
    y: 10,
    width: 190
  });
}

gerarPDF();