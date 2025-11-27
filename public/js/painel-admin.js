// ===============================================
//  Painel Administrativo – Da Família Lanches
//  Arquivo: public/js/painel-admin.js
// ===============================================

// Import Firebase base
import { auth, db } from "./firebase-config-v2.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
    collection,
    addDoc,
    getDoc,
    getDocs,
    doc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// ==============================================
// 🔐 Verificação de acesso – apenas ADMIN entra
// ==============================================
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "index.html";
        return;
    }

    const userRef = doc(db, "usuariosPainel", user.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
        alert("Usuário não encontrado no painel.");
        window.location.href = "index.html";
        return;
    }

    const dados = snap.data();

    if (dados.tipo !== "admin") {
        alert("Acesso restrito. Apenas administradores podem entrar.");
        await signOut(auth);
        window.location.href = "index.html";
        return;
    }

    // Se chegou até aqui → É ADMIN
    carregarEstoque();
    carregarGastos();
    carregarEntregas();
});

// ==============================================
// 🚪 Botão sair
// ==============================================
document.getElementById("logoutBtn")?.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "index.html";
});

// ==============================================
// 📦 Estoque – Listar
// ==============================================
async function carregarEstoque() {
    const lista = document.getElementById("listaEstoque");

    if (!lista) return;

    lista.innerHTML = "<p>Carregando...</p>";

    const snap = await getDocs(collection(db, "estoque"));

    if (snap.empty) {
        lista.innerHTML = "<p>Nenhum item de estoque cadastrado.</p>";
        return;
    }

    lista.innerHTML = "";

    snap.forEach(docu => {
        const item = docu.data();
        lista.innerHTML += `
            <div class="itemEstoque">
                <strong>${item.nome}</strong><br>
                Quantidade: ${item.quantidade}<br>
                Última atualização: ${item.atualizadoEm}
            </div>
        `;
    });
}

// ==============================================
// 📦 Estoque – Adicionar
// ==============================================
document.getElementById("btnAddEstoque")?.addEventListener("click", async () => {
    const nome = document.getElementById("nomeItem").value;
    const qtd = Number(document.getElementById("quantidadeItem").value);

    if (!nome || qtd <= 0) {
        alert("Preencha todos os campos.");
        return;
    }

    await addDoc(collection(db, "estoque"), {
        nome,
        quantidade: qtd,
        atualizadoEm: new Date().toLocaleString("pt-BR")
    });

    alert("Item adicionado ao estoque!");
    carregarEstoque();
});

// ==============================================
// 💰 Gastos – Registrar
// ==============================================
document.getElementById("btnSalvarGasto")?.addEventListener("click", async () => {
    const descricao = document.getElementById("descricaoGasto").value;
    const valor = Number(document.getElementById("valorGasto").value);

    if (!descricao || valor <= 0) {
        alert("Preencha todos os campos.");
        return;
    }

    await addDoc(collection(db, "gastosMercado"), {
        descricao,
        valor,
        criadoEm: new Date().toLocaleString("pt-BR")
    });

    alert("Gasto registrado!");
    carregarGastos();
});

// ==============================================
// 💰 Gastos – Listar
// ==============================================
async function carregarGastos() {
    const lista = document.getElementById("listaGastos");

    if (!lista) return;

    lista.innerHTML = "<p>Carregando...</p>";

    const snap = await getDocs(collection(db, "gastosMercado"));

    if (snap.empty) {
        lista.innerHTML = "<p>Nenhum gasto registrado ainda.</p>";
        return;
    }

    lista.innerHTML = "";

    snap.forEach(docu => {
        const item = docu.data();
        lista.innerHTML += `
            <div class="itemGasto">
                <strong>${item.descricao}</strong><br>
                Valor: R$ ${item.valor.toFixed(2)}<br>
                Data: ${item.criadoEm}
            </div>
        `;
    });
}

// ==============================================
// 🛵 Entregas – Registrar
// ==============================================
document.getElementById("btnSalvarEntrega")?.addEventListener("click", async () => {
    const quantidade = Number(document.getElementById("qtdEntrega").value);
    const motoboy = document.getElementById("motoboyEntrega").value;

    if (!motoboy || quantidade <= 0) {
        alert("Preencha todos os campos.");
        return;
    }

    await addDoc(collection(db, "entregasRegistradas"), {
        motoboy,
        quantidade,
        data: new Date().toLocaleString("pt-BR")
    });

    alert("Entrega registrada!");
    carregarEntregas();
});

// ==============================================
// 🛵 Entregas – Listar
// ==============================================
async function carregarEntregas() {
    const lista = document.getElementById("listaEntregas");

    if (!lista) return;

    lista.innerHTML = "<p>Carregando...</p>";

    const snap = await getDocs(collection(db, "entregasRegistradas"));

    if (snap.empty) {
        lista.innerHTML = "<p>Nenhuma entrega registrada ainda.</p>";
        return;
    }

    lista.innerHTML = "";

    snap.forEach(docu => {
        const item = docu.data();
        lista.innerHTML += `
            <div class="itemEntrega">
                <strong>${item.motoboy}</strong><br>
                Entregas: ${item.quantidade}<br>
                Data: ${item.data}
            </div>
        `;
    });
}