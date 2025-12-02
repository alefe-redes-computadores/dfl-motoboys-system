// =========================================================
//  DFL — DASHBOARD ADMIN (VERSÃO FINAL CORRIGIDA)
// =========================================================

import { auth, db } from "./firebase-config-v2.js";

import {
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// =========================================================
//  ACESSO APENAS ADMIN
// =========================================================
const ADMINS = [
  "6YczX4gLpUStlBVdQOXWc3uEYGG2",
  "LYu3M8gyRdMCqhE90vmH9Jh5Ksj1",
  "plSHKV043gTpEYfx7I3TI6FsJG93",
  "zIfbMxD1SQNvtlX9y6YUsEz2TXC3"
];

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

  carregarListaMotoboys();
  carregarSaldoGeral();
  verificarEstoqueHoje();
});

// =========================================================
//  LOGOUT
// =========================================================
document.getElementById("logoutAdmin")?.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// =========================================================
//  BOTÃO RELATÓRIOS
// =========================================================
document.getElementById("btnRelatorios")?.addEventListener("click", () => {
  window.location.href = "relatorios.html";
});

// =========================================================
// 🔥 MOTOBOYS FIXOS
// =========================================================
const MOTOS_FIXOS = {
  lucas_hiago: "Lucas Hiago",
  rodrigo_goncalves: "Rodrigo Gonçalves"
};

// =========================================================
//  CALCULAR SALDO DINÂMICO (Rodrigo + Outros)
// =========================================================
async function calcularSaldoDinamico(idMotoboy, nome) {
  // Somar entregas
  const q1 = query(collection(db, "entregasManuais"), where("motoboy", "==", idMotoboy));
  const snap1 = await getDocs(q1);

  let totalEntregas = 0;
  snap1.forEach(d => totalEntregas += Number(d.data().valorPago || 0));

  // Somar pagamentos (despesas automáticas)
  const q2 = query(
    collection(db, "despesas"),
    where("descricao", "==", `Pagamento motoboy — ${nome}`)
  );
  const snap2 = await getDocs(q2);

  let totalPagamentos = 0;
  snap2.forEach(d => totalPagamentos += Number(d.data().valor || 0));

  return totalEntregas - totalPagamentos;
}

// =========================================================
//  LISTAR MOTOBOYS (ORDEM FIXA + CORES CORRETAS)
// =========================================================
async function carregarListaMotoboys() {
  const listaEl = document.getElementById("listaMotoboys");
  listaEl.innerHTML = "<p>Carregando...</p>";

  let html = "";

  // ---------- 1. Lucas Hiago (saldo manual) ----------
  let snapLucas = await getDoc(doc(db, "motoboys", "lucas_hiago"));
  let saldoLucas = snapLucas.exists() ? Number(snapLucas.data().saldo || 0) : 0;

  let classeLucas =
    saldoLucas > 0 ? "negativo" :
    saldoLucas < 0 ? "positivo" : "neutral";

  html += `
    <div class="motoboy-item ${classeLucas}">
      <strong>Lucas Hiago</strong>
      <span>R$ ${saldoLucas.toFixed(2).replace(".", ",")}</span>
    </div>
  `;

  // ---------- 2. Rodrigo Gonçalves (saldo dinâmico) ----------
  let saldoRodrigo = await calcularSaldoDinamico("rodrigo_goncalves", "Rodrigo Gonçalves");

  let classeRodrigo =
    saldoRodrigo > 0 ? "negativo" :
    saldoRodrigo < 0 ? "positivo" : "neutral";

  html += `
    <div class="motoboy-item ${classeRodrigo}">
      <strong>Rodrigo Gonçalves</strong>
      <span>R$ ${saldoRodrigo.toFixed(2).replace(".", ",")}</span>
    </div>
  `;

  // ---------- 3. Outros motoboys ----------
  const snap = await getDocs(collection(db, "motoboys"));

  snap.forEach((docu) => {
    const id = docu.id;
    const data = docu.data();

    if (id === "lucas_hiago" || id === "rodrigo_goncalves") return;

    const nome = data.nome;
    calcularSaldoDinamico(id, nome).then(saldo => {
      let classe =
        saldo > 0 ? "negativo" :
        saldo < 0 ? "positivo" : "neutral";

      listaEl.innerHTML += `
        <div class="motoboy-item ${classe}">
          <strong>${nome}</strong>
          <span>R$ ${saldo.toFixed(2).replace(".", ",")}</span>
        </div>
      `;
    });
  });

  listaEl.innerHTML = html;
}

// =========================================================
//  SALDO GERAL (RODANDO APÓS TODOS)
// =========================================================
async function carregarSaldoGeral() {
  // Soma apenas motoboys fixos + outros que existam
  let total = 0;

  // Lucas (manual)
  let snapLucas = await getDoc(doc(db, "motoboys", "lucas_hiago"));
  total += snapLucas.exists() ? Number(snapLucas.data().saldo || 0) : 0;

  // Rodrigo (dinâmico)
  total += await calcularSaldoDinamico("rodrigo_goncalves", "Rodrigo Gonçalves");

  // Outros
  const snap = await getDocs(collection(db, "motoboys"));
  for (let d of snap.docs) {
    if (d.id === "lucas_hiago" || d.id === "rodrigo_goncalves") continue;
    total += await calcularSaldoDinamico(d.id, d.data().nome);
  }

  const el = document.getElementById("saldoGeral");
  el.textContent = "R$ " + total.toFixed(2).replace(".", ",");
  el.className =
    total > 0 ? "admin-value negativo" :
    total < 0 ? "admin-value positivo" : "admin-value neutral";
}

// =========================================================
//  CATEGORIAS DE ESTOQUE
// =========================================================
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

  outros_extra: [
    "Outro (Preencher manualmente)"
  ]
};

const categoriaSel = document.getElementById("estoqueCategoria");
const itemSel = document.getElementById("estoqueItem");

function atualizarItens() {
  const cat = categoriaSel.value;
  const itens = SUBITENS[cat] || [];

  itemSel.innerHTML = itens
    .sort()
    .map(i => `<option value="${i}">${i}</option>`)
    .join("");
}
categoriaSel.addEventListener("change", atualizarItens);
atualizarItens();

// =========================================================
//  SALVAR ESTOQUE
// =========================================================
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

// =========================================================
//  MOSTRAR BOTÃO PDF DE ESTOQUE
// =========================================================
async function verificarEstoqueHoje() {
  const hoje = new Date().toISOString().slice(0, 10);

  const q = query(collection(db, "estoqueDia"), where("data", "==", hoje));
  const snap = await getDocs(q);

  const btn = document.getElementById("btnGerarPdfEstoque");
  btn.style.display = snap.size > 0 ? "block" : "none";
}

// =========================================================
//  ABRIR PDF
// =========================================================
document.getElementById("btnGerarPdfEstoque").addEventListener("click", () => {
  window.location.href = "pdf-estoque.html";
});

// =========================================================
//  REGISTRAR DESPESA MANUAL
// =========================================================
document.getElementById("btnSalvarDespesa").addEventListener("click", async () => {
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

  alert("Despesa registrada!");
});

// =========================================================
// 🔥 REGISTRAR ENTREGA + PAGAMENTO PARA MOTOBOY
// =========================================================

const selMotoboy = document.getElementById("entregaMotoboy");
const campoOutro = document.getElementById("grupoMotoboyOutro");

selMotoboy.addEventListener("change", () => {
  campoOutro.style.display = selMotoboy.value === "outro" ? "block" : "none";
});

document.getElementById("btnSalvarEntregaManual").addEventListener("click", async () => {

  const idMotoboy = selMotoboy.value;
  const nomeOutro = document.getElementById("entregaMotoboyOutro").value.trim();

  const qtdEntregas = Number(document.getElementById("entregaQtd").value);
  const valorManual = Number(document.getElementById("valorPagoMotoboy").value);
  const data = document.getElementById("entregaData").value;

  if (!qtdEntregas || !data) {
    alert("Preencha todos os campos obrigatórios.");
    return;
  }

  let nomeMotoboy = "";
  let valorPago = 0;

  if (idMotoboy === "outro") {
    if (!nomeOutro) {
      alert("Digite o nome do motoboy.");
      return;
    }
    nomeMotoboy = nomeOutro;
    valorPago = valorManual;
  }

  else if (idMotoboy === "lucas_hiago") {
    nomeMotoboy = "Lucas Hiago";
    valorPago = qtdEntregas * 6;
  }

  else if (idMotoboy === "rodrigo_goncalves") {
    nomeMotoboy = "Rodrigo Gonçalves";
    if (qtdEntregas <= 10) valorPago = 100;
    else valorPago = 100 + (qtdEntregas - 10) * 7;
  }

  // ============================================
  // SALVAR REGISTRO DE ENTREGA
  // ============================================
  await addDoc(collection(db, "entregasManuais"), {
    motoboy: idMotoboy,
    nomeMotoboy,
    quantidade: qtdEntregas,
    valorPago,
    data
  });

  // ============================================
  // SE FOR OUTRO OU RODRIGO → SALDO DINÂMICO AUTOMÁTICO
  // ============================================
  if (idMotoboy === "outro" || idMotoboy === "rodrigo_goncalves") {
    // Registrar também como despesa automática
    await addDoc(collection(db, "despesas"), {
      descricao: `Pagamento motoboy — ${nomeMotoboy}`,
      valor: Number(valorPago),
      data
    });
  }

  // ============================================
  // LUCAS HIAGO → SALDO MANUAL (ATUALIZA DIRETO)
  // ============================================
  if (idMotoboy === "lucas_hiago") {
    const ref = doc(db, "motoboys", idMotoboy);

    const snap = await getDoc(ref);
    let saldoAtual = snap.exists() ? Number(snap.data().saldo || 0) : 0;

    saldoAtual += valorPago;

    await setDoc(ref, {
      nome: nomeMotoboy,
      saldo: saldoAtual
    }, { merge: true });
  }

  alert("Entrega registrada com sucesso!");

  carregarListaMotoboys();
  carregarSaldoGeral();
});