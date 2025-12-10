// ============================================================
//  PDF – RELATÓRIO DE CAIXA (DFL) – VERSÃO OFICIAL
//  Lê a coleção "caixa" no Firestore e monta a tabela.
//  Mantém o mesmo padrão dos PDFs existentes.
// ============================================================

import { db } from "./firebase-config-v2.js";

import {
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";


// ============================================================
//  ELEMENTOS
// ============================================================
const tabela = document.getElementById("listaCaixa");
const btnGerarPdf = document.getElementById("btnGerarPdf");


// ============================================================
//  FORMATAR DATA BRASILEIRA
// ============================================================
function formatarData(iso) {
  if (!iso) return "-";
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}


// ============================================================
//  CARREGAR REGISTROS DO CAIXA
//  Estrutura esperada em cada documento Firestore:
//  {
//     data: "2025-01-12",
//     tipo: "entrada" | "saida",
//     categoria: "Dinheiro" | "Crédito" | etc,
//     descricao: "Exemplo",
//     valor: 45.90
//  }
// ============================================================
async function carregarCaixa() {
  tabela.innerHTML = `<tr><td colspan="5">Carregando...</td></tr>`;

  try {
    const q = query(
      collection(db, "caixa"),
      orderBy("data", "desc")
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      tabela.innerHTML = `<tr><td colspan="5">Nenhum registro encontrado.</td></tr>`;
      return;
    }

    let html = "";

    snap.forEach(doc => {
      const x = doc.data();

      html += `
        <tr>
          <td>${formatarData(x.data)}</td>
          <td>${x.tipo || "-"}</td>
          <td>${x.categoria || "-"}</td>
          <td>${x.descricao || "-"}</td>
          <td>R$ ${Number(x.valor || 0).toFixed(2).replace(".", ",")}</td>
        </tr>
      `;
    });

    tabela.innerHTML = html;

  } catch (e) {
    console.error("Erro ao carregar caixa:", e);
    tabela.innerHTML = `<tr><td colspan="5">Erro ao carregar dados.</td></tr>`;
  }
}

carregarCaixa();


// ============================================================
//  GERAR PDF (MESMO PADRÃO DOS OUTROS RELATÓRIOS)
// ============================================================
btnGerarPdf.addEventListener("click", () => {
  const opt = {
    margin: 10,
    filename: `relatorio_caixa_DFL.pdf`,
    html2canvas: { scale: 2 },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
  };

  html2pdf().set(opt).from(document.body).save();
});