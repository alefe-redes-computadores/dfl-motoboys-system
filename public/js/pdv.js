// ============================================================
//  DFL – MINI-PDV OFICIAL 2025
//  Entradas, Saídas, Sangrias, Fechamento Diário
// ============================================================

import { auth, db } from "./firebase-config-v2.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
    addDoc,
    collection,
    getDocs,
    query,
    where,
    doc,
    setDoc
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";


// ============================================================
//  🔐 REQUER LOGIN DE ADMIN
// ============================================================
const ADMINS = [
    "6YczX4gLpUStlBVdQOXWc3uEYGG2",
    "LYu3M8gyRdMCqhE90vmH9Jh5Ksj1",
    "plSHKV043gTpEYfx7I3TI6FsJG93",
    "zIfbMxD1SQNvtlX9y6YUsEz2TXC3"
];

let operadorUID = null;

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "index.html";
        return;
    }

    if (!ADMINS.includes(user.uid)) {
        alert("Acesso restrito.");
        window.location.href = "dashboard.html";
        return;
    }

    operadorUID = user.uid;

    carregarMovimentosDoDia();
});


// ============================================================
//  🗓️ DATA DO DIA (Formato YYYY-MM-DD)
// ============================================================
function dataHoje() {
    return new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 10);
}


// ============================================================
//  💵 REGISTRAR ENTRADA
// ============================================================
document.getElementById("btnRegistrarEntrada").addEventListener("click", async () => {
    const valor = Number(document.getElementById("entradaValor").value);
    const pagamento = document.getElementById("entradaPagamento").value;
    const categoria = document.getElementById("entradaCategoria").value;
    const descricao = document.getElementById("entradaDescricao").value || categoria;

    if (!valor || valor <= 0) {
        alert("Valor inválido.");
        return;
    }

    await addDoc(collection(db, "caixa"), {
        tipo: "entrada",
        valor,
        pagamento,
        categoria,
        descricao,
        operador: operadorUID,
        data: dataHoje(),
        timestamp: Date.now()
    });

    alert("Entrada registrada!");
    limparCamposEntrada();
    carregarMovimentosDoDia();
});

function limparCamposEntrada() {
    document.getElementById("entradaValor").value = "";
    document.getElementById("entradaDescricao").value = "";
}


// ============================================================
//  💸 REGISTRAR SAÍDA
// ============================================================
document.getElementById("btnRegistrarSaida").addEventListener("click", async () => {
    const valor = Number(document.getElementById("saidaValor").value);
    const categoria = document.getElementById("saidaCategoria").value;
    const descricao = document.getElementById("saidaDescricao").value || categoria;

    if (!valor || valor <= 0) {
        alert("Valor inválido.");
        return;
    }

    await addDoc(collection(db, "caixa"), {
        tipo: "saida",
        valor,
        pagamento: "—",
        categoria,
        descricao,
        operador: operadorUID,
        data: dataHoje(),
        timestamp: Date.now()
    });

    alert("Saída registrada!");
    limparCamposSaida();
    carregarMovimentosDoDia();
});

function limparCamposSaida() {
    document.getElementById("saidaValor").value = "";
    document.getElementById("saidaDescricao").value = "";
}


// ============================================================
//  🟥 REGISTRAR SANGRIA
// ============================================================
document.getElementById("btnRegistrarSangria").addEventListener("click", async () => {
    const valor = Number(document.getElementById("sangriaValor").value);
    const descricao = document.getElementById("sangriaDescricao").value || "Sangria";

    if (!valor || valor <= 0) {
        alert("Valor inválido.");
        return;
    }

    await addDoc(collection(db, "caixa"), {
        tipo: "sangria",
        valor,
        pagamento: "—",
        categoria: "Sangria / Retirada",
        descricao,
        operador: operadorUID,
        data: dataHoje(),
        timestamp: Date.now()
    });

    alert("Sangria registrada!");
    limparCamposSangria();
    carregarMovimentosDoDia();
});

function limparCamposSangria() {
    document.getElementById("sangriaValor").value = "";
    document.getElementById("sangriaDescricao").value = "";
}


// ============================================================
//  📜 LISTAR MOVIMENTOS DO DIA
// ============================================================
async function carregarMovimentosDoDia() {
    const listaEl = document.getElementById("listaMovimentos");
    listaEl.innerHTML = "<p>Carregando...</p>";

    const q = query(collection(db, "caixa"), where("data", "==", dataHoje()));
    const snap = await getDocs(q);

    if (snap.empty) {
        listaEl.innerHTML = "<p>Nenhum movimento registrado hoje.</p>";
        return;
    }

    let html = "";

    snap.forEach((d) => {
        const x = d.data();
        let cor = x.tipo === "entrada" ? "green" : x.tipo === "saida" ? "red" : "orange";

        html += `
            <div class="mov-item" style="border-left: 4px solid ${cor}">
                <strong>${x.tipo.toUpperCase()} — R$ ${x.valor.toFixed(2)}</strong><br>
                <small>${x.categoria} — ${x.pagamento}</small><br>
                <small>${x.descricao}</small><br>
            </div>
        `;
    });

    listaEl.innerHTML = html;
}


// ============================================================
//  📊 FECHAMENTO DO DIA
// ============================================================
document.getElementById("btnFecharCaixa").addEventListener("click", async () => {
    const obs = document.getElementById("fechamentoObs").value;

    const q = query(collection(db, "caixa"), where("data", "==", dataHoje()));
    const snap = await getDocs(q);

    if (snap.empty) {
        alert("Nenhum movimento registrado hoje.");
        return;
    }

    let totalEntradas = 0;
    let totalSaidas = 0;
    let totalSangrias = 0;

    let formas = {
        "Dinheiro": 0,
        "Cartão de Crédito": 0,
        "Cartão de Débito": 0,
        "PIX": 0,
        "Ifood": 0,
        "Outros": 0
    };

    snap.forEach((d) => {
        const x = d.data();

        if (x.tipo === "entrada") {
            totalEntradas += x.valor;
            if (formas[x.pagamento] !== undefined) {
                formas[x.pagamento] += x.valor;
            }

        } else if (x.tipo === "saida") {
            totalSaidas += x.valor;

        } else if (x.tipo === "sangria") {
            totalSangrias += x.valor;
        }
    });

    const saldoFinal = totalEntradas - (totalSaidas + totalSangrias);

    // Registrar o fechamento no Firestore
    await setDoc(doc(db, "caixaFechamento", dataHoje()), {
        data: dataHoje(),
        operador: operadorUID,
        observacoes: obs,
        totalEntradas,
        totalSaidas,
        totalSangrias,
        saldoFinal,
        formasPagamento: formas,
        timestamp: Date.now()
    });

    mostrarResultadoFechamento(totalEntradas, totalSaidas, totalSangrias, saldoFinal, formas);
});


function mostrarResultadoFechamento(entradas, saidas, sangrias, saldo, formas) {
    const box = document.getElementById("resultadoFechamento");

    let htmlFormas = "";
    for (let f in formas) {
        htmlFormas += `<li>${f}: R$ ${formas[f].toFixed(2)}</li>`;
    }

    box.innerHTML = `
        <h3>Fechamento do Dia</h3>

        <p><strong>Total Entradas:</strong> R$ ${entradas.toFixed(2)}</p>
        <p><strong>Total Saídas:</strong> R$ ${saidas.toFixed(2)}</p>
        <p><strong>Total Sangrias:</strong> R$ ${sangrias.toFixed(2)}</p>

        <h4>Por Forma de Pagamento</h4>
        <ul>${htmlFormas}</ul>

        <p><strong>Saldo Final:</strong> R$ ${saldo.toFixed(2)}</p>

        <p><em>Fechamento salvo no sistema.</em></p>
    `;
}