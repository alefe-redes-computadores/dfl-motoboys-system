// =========================================
//  DFL — DASHBOARD ADMIN (VERSÃO FINAL)
// =========================================

import { auth, db } from "./firebase-config-v2.js";

import {
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
  doc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
  getDocs,
  query,
  where,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// UID dos administradores
const ADMINS = [
  "6YczX4gLpUStlBVdQOXWc3uEYGG2",
  "LYu3M8gyRdMCqhE90vmH9Jh5Ksj1",
  "plSHKV043gTpEYfx7I3TI6FsJG93",
  "zIfbMxD1SQNvtlX9y6YUsEz2TXC3"
];

// =======================
// Helper: normalizar ID para motoboy "outro"
// =======================
function gerarIdMotoboy(nome) {
  return (
    nome
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "motoboy_generico"
  );
}

// =======================
// VERIFICA LOGIN
// =======================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  if (!ADMINS.includes(user.uid)) {
    alert("Acesso restrito a administradores.");
    window.location.href = "dashboard.html";
    return;
  }

  carregarSaldoMotoboy();
  verificarEstoqueHoje();
});

// =======================
// LOGOUT
// =======================
document.getElementById("logoutAdmin")?.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// =======================
// BOTÃO RELATÓRIOS
// =======================
document.getElementById("btnRelatorios")?.addEventListener("click", () => {
  window.location.href = "relatorios.html";
});

// =======================
// SALDO DO MOTOBOY + GERAL (DINÂMICO)
// =======================
async function carregarSaldoMotoboy() {
  const lista = document.getElementById("listaMotoboys");
  const saldoGeralEl = document.getElementById("saldoGeral");

  if (!lista) return;

  lista.innerHTML = "<p>Carregando motoboys...</p>";

  const snapAll = await getDocs(collection(db, "motoboys"));
  let total = 0;
  const motoboys = [];

  snapAll.forEach((d) => {
    const data = d.data();
    const saldo = Number(data.saldo || 0);
    let nome = data.nome;

    if (!nome) {
      if (d.id === "lucas_hiago") nome = "Lucas Hiago";
      else if (d.id === "rodrigo_goncalves") nome = "Rodrigo Gonçalves";
      else nome = d.id;
    }

    total += saldo;
    motoboys.push({ id: d.id, nome, saldo });
  });

  if (motoboys.length === 0) {
    lista.innerHTML = "<p>Nenhum motoboy cadastrado.</p>";
  } else {
    // Ordena por maior saldo absoluto (mais relevante em cima)
    motoboys.sort((a, b) => Math.abs(b.saldo) - Math.abs(a.saldo));

    lista.innerHTML = "";
    motoboys.forEach((m) => {
      const wrapper = document.createElement("div");
      wrapper.className = "motoboy-item";

      let classeSaldo = "motoboy-saldo neutral";
      if (m.saldo > 0) classeSaldo = "motoboy-saldo negativo"; // devendo
      else if (m.saldo < 0) classeSaldo = "motoboy-saldo positivo"; // empresa no positivo

      const saldoFormatado = `R$ ${m.saldo.toFixed(2).replace(".", ",")}`;

      wrapper.innerHTML = `
        <span class="motoboy-nome">${m.nome}</span>
        <span class="${classeSaldo}">${saldoFormatado}</span>
      `;

      lista.appendChild(wrapper);
    });
  }

  // Atualiza saldo geral
  saldoGeralEl.textContent = "R$ " + total.toFixed(2).replace(".", ",");
  if (total > 0) saldoGeralEl.className = "admin-value negativo";
  else if (total < 0) saldoGeralEl.className = "admin-value positivo";
  else saldoGeralEl.className = "admin-value neutral";
}

// =======================
// CATEGORIAS + SUBITENS
// =======================
const SUBITENS = {
  frios: [
    "Bacon",
    "Carne Moída/Artesanais",
    "Cheddar",
    "Filé de Frango",
    "Hambúrguer",
    "Mussarela",
    "Presunto",
    "Salsicha"
  ],

  refrigerantes: [
    "Coca 200ml",
    "Coca 310ml",
    "Coca 310ml Zero",
    "Coca 1L",
    "Coca 1L Zero",
    "Coca 2L",
    "Del Valle 450ml Uva",
    "Del Valle 450ml Laranja",
    "Fanta 1L",
    "Kuat 2L"
  ],

  embalagens: [
    "Bobina",
    "Dogueira",
    "Hamburgueira",
    "Papel Kraft",
    "Saco Plástico",
    "Sacola 30x40",
    "Sacola 38x48"
  ],

  paes: ["Pão Hambúrguer", "Pão Hot Dog"],

  // 🔄 RENOMEADO: antes era "outros"
  hortifruti: [
    "Alface",
    "Batata Palha",
    "Cebola",
    "Cebolinha",
    "Milho",
    "Óleo",
    "Ovo",
    "Tomate"
  ],

  // 🆕 NOVA CATEGORIA: apenas 1 item manual
  outros_extra: ["Outro (Preencher manualmente)"]
};

const categoriaSel = document.getElementById("estoqueCategoria");
const itemSel = document.getElementById("estoqueItem");

function atualizarItens() {
  const cat = categoriaSel.value;
  const itens = SUBITENS[cat] || [];

  itemSel.innerHTML = itens
    .sort()
    .map((i) => `<option value="${i}">${i}</option>`)
    .join("");
}

categoriaSel.addEventListener("change", atualizarItens);
atualizarItens();

// =======================
// SALVAR ESTOQUE
// =======================
document.getElementById("btnSalvarEstoque").addEventListener("click", async () => {
  const categoria = categoriaSel.value;
  const item = itemSel.value;
  const qtd = document.getElementById("estoqueQtd").value;
  const data = document.getElementById("estoqueData").value;

  if (!categoria || !item || !qtd || !data) {
    alert("Preencha todos os campos.");
    return;
  }

  await addDoc(collection(db, "estoqueDia"), {
    categoria,
    item,
    quantidade: qtd,
    data
  });

  alert("Estoque salvo!");
  verificarEstoqueHoje();
});

// =======================
// MOSTRAR BOTÃO PDF
// =======================
async function verificarEstoqueHoje() {
  const hoje = new Date().toISOString().slice(0, 10);

  const q = query(collection(db, "estoqueDia"), where("data", "==", hoje));

  const snap = await getDocs(q);

  const btn = document.getElementById("btnGerarPdfEstoque");
  btn.style.display = snap.size > 0 ? "block" : "none";
}

// =======================
// ABRIR GERADOR DE PDF
// =======================
document.getElementById("btnGerarPdfEstoque").addEventListener("click", () => {
  window.location.href = "pdf-estoque.html";
});

// =======================
// SALVAR DESPESA
// =======================
document
  .getElementById("btnSalvarDespesa")
  .addEventListener("click", async () => {
    const desc = document.getElementById("descDespesa").value;
    const valor = document.getElementById("valorDespesa").value;
    const data = document.getElementById("dataDespesa").value;

    if (!desc || !valor || !data) {
      alert("Preencha todos os campos.");
      return;
    }

    await addDoc(collection(db, "despesas"), {
      descricao: desc,
      valor: Number(valor),
      data
    });

    alert("Despesa salva!");
  });

// =======================
// ENTREGAS / PAGAMENTOS PARA MOTOBOY
// =======================
const selectMotoboy = document.getElementById("entregaMotoboy");
const grupoMotoboyOutro = document.getElementById("grupoMotoboyOutro");
const inputMotoboyOutro = document.getElementById("entregaMotoboyOutro");

selectMotoboy.addEventListener("change", () => {
  if (selectMotoboy.value === "outro") {
    grupoMotoboyOutro.style.display = "block";
  } else {
    grupoMotoboyOutro.style.display = "none";
    inputMotoboyOutro.value = "";
  }
});

document
  .getElementById("btnSalvarEntregaManual")
  .addEventListener("click", async () => {
    let motoboyId = selectMotoboy.value;
    let motoboyNome = "";

    if (motoboyId === "lucas_hiago") {
      motoboyNome = "Lucas Hiago";
    } else if (motoboyId === "rodrigo_goncalves") {
      motoboyNome = "Rodrigo Gonçalves";
    } else if (motoboyId === "outro") {
      const nomeOutro = inputMotoboyOutro.value.trim();
      if (!nomeOutro) {
        alert("Preencha o nome do motoboy (outro).");
        return;
      }
      motoboyNome = nomeOutro;
      motoboyId = gerarIdMotoboy(nomeOutro);
    }

    const qtd = Number(document.getElementById("entregaQtd").value);
    const valorPago = Number(
      document.getElementById("valorPagoMotoboy").value
    );
    const data = document.getElementById("entregaData").value;

    if (!motoboyId || !motoboyNome || !qtd || qtd <= 0 || isNaN(valorPago) || valorPago <= 0 || !data) {
      alert("Preencha todos os campos corretamente (quantidade e valor > 0).");
      return;
    }

    // 🔹 Registro detalhado para relatórios
    await addDoc(collection(db, "entregasManuais"), {
      motoboyId,
      motoboyNome,
      quantidade: qtd,
      valorPago,
      data
    });

    // 🔹 Atualiza saldo no documento do motoboy
    const ref = doc(db, "motoboys", motoboyId);
    const snap = await getDoc(ref);

    let saldoAtual = snap.exists() ? Number(snap.data().saldo || 0) : 0;
    saldoAtual += qtd * 2; // mantém a regra atual (2 reais por entrega)

    if (snap.exists()) {
      await updateDoc(ref, {
        saldo: saldoAtual,
        nome: motoboyNome
      });
    } else {
      await setDoc(ref, {
        saldo: saldoAtual,
        nome: motoboyNome
      });
    }

    alert("Registro salvo!");
    carregarSaldoMotoboy();
  });