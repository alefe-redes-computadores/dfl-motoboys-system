// ============================================================
// 🔥 DFL • Mini-PDV (Modelo C – Profissional)
// Versão: 1.0 (Tema Escuro + Abas Modernas)
// Autor: ChatGPT + Álefe
// Sistema completo de Entradas, Saídas, Extrato e Fechamento.
// ============================================================

import { db } from "./firebase-config-v2.js";
import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// ===========================
// 📌 Função utilitária para pegar a data atual
// ===========================
function hoje() {
    const d = new Date();
    return d.toISOString().split("T")[0]; // YYYY-MM-DD
}

// ===========================
// 📌 Registrar ENTRADA
// ===========================
export async function registrarEntrada() {
    const valor = parseFloat(document.getElementById("entradaValor").value);
    const desc = document.getElementById("entradaDesc").value.trim();

    if (!valor || valor <= 0) {
        alert("Digite um valor válido.");
        return;
    }

    if (!desc) {
        alert("Digite uma descrição.");
        return;
    }

    const data = hoje();

    await addDoc(collection(db, "movimentacoesCaixa"), {
        tipo: "entrada",
        valor,
        descricao: desc,
        origem: "manual",
        data,
        hora: new Date().toLocaleTimeString("pt-BR"),
        timestamp: serverTimestamp()
    });

    alert("Entrada registrada com sucesso!");

    document.getElementById("entradaValor").value = "";
    document.getElementById("entradaDesc").value = "";

    carregarExtrato();
    carregarResumoFechamento();
}

// ===========================
// 📌 Registrar SAÍDA
// ===========================
export async function registrarSaida() {
    const valor = parseFloat(document.getElementById("saidaValor").value);
    const desc = document.getElementById("saidaDesc").value.trim();

    if (!valor || valor <= 0) {
        alert("Digite um valor válido.");
        return;
    }

    if (!desc) {
        alert("Digite uma descrição.");
        return;
    }

    const data = hoje();

    await addDoc(collection(db, "movimentacoesCaixa"), {
        tipo: "retirada",
        valor,
        descricao: desc,
        origem: "manual",
        data,
        hora: new Date().toLocaleTimeString("pt-BR"),
        timestamp: serverTimestamp()
    });

    alert("Retirada registrada com sucesso!");

    document.getElementById("saidaValor").value = "";
    document.getElementById("saidaDesc").value = "";

    carregarExtrato();
    carregarResumoFechamento();
}

// ============================================================
// 📌 Carregar EXTRATO do dia
// ============================================================
export async function carregarExtrato() {
    const dataHoje = hoje();
    const extratoLista = document.getElementById("extratoLista");

    extratoLista.innerHTML = `<p style="color:#aaa;">Carregando movimentações...</p>`;

    const q = query(
        collection(db, "movimentacoesCaixa"),
        where("data", "==", dataHoje),
        orderBy("timestamp", "desc")
    );

    const snap = await getDocs(q);

    if (snap.empty) {
        extratoLista.innerHTML = `<p style="color:#aaa;">Nenhuma movimentação registrada hoje.</p>`;
        return;
    }

    let html = "";

    snap.forEach(doc => {
        const mov = doc.data();
        const tipoClasse = mov.tipo === "entrada" ? "entrada" : "retirada";

        html += `
            <div class="extrato-item">
                <div class="tipo ${tipoClasse}">
                    ${mov.tipo.toUpperCase()}
                </div>
                <div class="valor ${tipoClasse}">
                    R$ ${mov.valor.toFixed(2).replace(".", ",")}
                </div>
                <div class="desc">${mov.descricao}</div>
                <div class="hora" style="color:#aaa; font-size:12px; margin-top:5px;">
                    ${mov.hora}
                </div>
            </div>
        `;
    });

    extratoLista.innerHTML = html;
}

// ============================================================
// 📌 Carregar RESUMO (Fechamento do Caixa)
// ============================================================
export async function carregarResumoFechamento() {
    const dataHoje = hoje();
    const box = document.getElementById("fechamentoResumo");

    box.innerHTML = `<p style="color:#aaa;">Carregando...</p>`;

    const q = query(
        collection(db, "movimentacoesCaixa"),
        where("data", "==", dataHoje)
    );

    const snap = await getDocs(q);

    let entradas = 0;
    let retiradas = 0;

    snap.forEach(x => {
        const mov = x.data();
        if (mov.tipo === "entrada") entradas += mov.valor;
        if (mov.tipo === "retirada") retiradas += mov.valor;
    });

    const saldoFinal = entradas - retiradas;

    box.innerHTML = `
        <div class="fechamento-card">
            <p><strong>Entradas:</strong> R$ ${entradas.toFixed(2).replace(".", ",")}</p>
            <p><strong>Retiradas:</strong> R$ ${retiradas.toFixed(2).replace(".", ",")}</p>
            <hr style="border-color:#333; margin:10px 0;">
            <h3>Saldo Final: R$ ${saldoFinal.toFixed(2).replace(".", ",")}</h3>
        </div>
    `;
}

// ============================================================
// 📌 Fechar Caixa (gera documento do dia)
// ============================================================
export async function fecharCaixa() {
    const dataHoje = hoje();

    const q = query(
        collection(db, "movimentacoesCaixa"),
        where("data", "==", dataHoje)
    );

    const snap = await getDocs(q);

    let entradas = 0;
    let retiradas = 0;

    snap.forEach(x => {
        const mov = x.data();
        if (mov.tipo === "entrada") entradas += mov.valor;
        if (mov.tipo === "retirada") retiradas += mov.valor;
    });

    const saldoFinal = entradas - retiradas;

    await addDoc(collection(db, "fechamentosCaixa"), {
        data: dataHoje,
        totalEntradas: entradas,
        totalRetiradas: retiradas,
        saldoFinal: saldoFinal,
        criadoEm: serverTimestamp()
    });

    alert("Caixa fechado com sucesso!");
    carregarResumoFechamento();
}

// ============================================================
// 📌 Inicialização automática ao abrir o PDV
// ============================================================
window.onload = () => {
    carregarExtrato();
    carregarResumoFechamento();
};