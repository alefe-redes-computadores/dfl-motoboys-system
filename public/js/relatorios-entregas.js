// ===================================================================
// 📊 RELATÓRIO PROFISSIONAL — ENTREGAS & PAGAMENTOS MOTOBOYS
// ===================================================================

import { db } from "./firebase-config-v2.js";

import {
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";


// ===============================
// ELEMENTOS DA PÁGINA
// ===============================
const resumoTotalEntregas = document.getElementById("resumoTotalEntregas");
const resumoTotalPago = document.getElementById("resumoTotalPago");
const rankingMotoboys = document.getElementById("rankingMotoboys");

const tabelaBody = document.getElementById("tabelaEntregas");


// ===============================
// FORMATADOR DE MOEDA
// ===============================
function money(n) {
  return "R$ " + Number(n || 0).toFixed(2).replace(".", ",");
}


// ===============================
// CARREGAR RELATÓRIO
// ===============================
async function carregarRelatorio() {

  // Carrega todas as entregas
  const q = query(
    collection(db, "entregasManuais"),
    orderBy("timestamp", "desc")
  );

  const snap = await getDocs(q);

  if (snap.size === 0) {
    tabelaBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center;">Nenhuma entrega registrada.</td>
      </tr>
    `;
    return;
  }

  // Estrutura para resumo
  let totalEntregas = 0;
  let totalPago = 0;

  let motoboysResumo = {};  
  // Exemplo:
  // {
  //   lucas_hiago: { nome: "Lucas Hiago", entregas: 12, recebido: 84 }
  // }

  tabelaBody.innerHTML = "";

  snap.forEach(doc => {
    const d = doc.data();

    const motox = d.motoboyNome || d.motoboy;
    const qtd = Number(d.qtd || 0);
    const valor = Number(d.valorPago || 0);
    const data = d.data || "-";

    totalEntregas += qtd;
    totalPago += valor;

    if (!motoboysResumo[motox]) {
      motoboysResumo[motox] = { entregas: 0, recebido: 0 };
    }

    motoboysResumo[motox].entregas += qtd;
    motoboysResumo[motox].recebido += valor;

    // Preenche tabela
    tabelaBody.innerHTML += `
      <tr>
        <td>${motox}</td>
        <td>${qtd}</td>
        <td>${money(valor)}</td>
        <td>${data}</td>
      </tr>
    `;
  });

  // ===============================
  // PREENCHER RESUMO SUPERIOR
  // ===============================
  resumoTotalEntregas.textContent = totalEntregas;
  resumoTotalPago.textContent = money(totalPago);

  // Ranking
  const rankingArray = Object.entries(motoboysResumo).sort(
    (a, b) => b[1].entregas - a[1].entregas
  );

  rankingMotoboys.innerHTML = rankingArray
    .map(([nome, info], pos) => {
      return `
        <div class="ranking-item">
          <strong>${pos + 1}º — ${nome}</strong>
          <span>${info.entregas} entregas • ${money(info.recebido)}</span>
        </div>
      `;
    })
    .join("");

}


// Carrega relatório ao abrir página
carregarRelatorio();