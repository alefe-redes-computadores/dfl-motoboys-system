import { db } from "./firebase-config-v2.js";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const MOTOBOY_ID = "rodrigo_goncalves";

const money = v => `R$ ${Number(v||0).toFixed(2).replace(".", ",")}`;

async function carregarRelatorio() {
  const q = query(
    collection(db, "historicoMotoboy"),
    where("motoboyId", "==", MOTOBOY_ID),
    orderBy("timestamp", "desc"),
    limit(1)
  );

  const snap = await getDocs(q);
  if (snap.empty) return;

  const d = snap.docs[0].data();

  pdfEntregas.textContent = d.entregas;
  pdfGanho.textContent = money(d.ganhoEntregas);
  pdfDinheiro.textContent = money(d.dinheiroRecebido);
  pdfConsumo.textContent = money(d.consumo);
  pdfSaldoDia.textContent = money(d.saldoDoDia);
}

document.addEventListener("DOMContentLoaded", carregarRelatorio);