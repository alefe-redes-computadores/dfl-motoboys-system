import { auth, db } from "./firebase-config-v2.js";

import {
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
  doc,
  getDoc,
  addDoc,
  updateDoc,
  getDocs,
  collection,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";


// =======================
// ADMINISTRADORES
// =======================
const ADMINS = [
  "6YczX4gLpUStlBVdQOXWc3uEYGG2",
  "LYu3M8gyRdMCqhE90vmH9Jh5Ksj1",
  "plSHKV043gTpEYfx7I3TI6FsJG93",
  "zIfbMxD1SQNvtlX9y6YUsEz2TXC3"
];


// =======================
// MAPA DE SUBCATEGORIAS
// =======================
const SUBCATEGORIAS = {
  frios: [
    "Bacon",
    "Carne Moída / Artesanais",
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
    "Del Valle 450ml Uva",
    "Del Valle 450ml Laranja",
    "Fanta 1L",
    "Coca 1L",
    "Coca 1L Zero",
    "Kuat 2L",
    "Coca 2L"
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
  pães: [
    "Pão de Hambúrguer",
    "Pão de Hot Dog"
  ],
  outros: [
    "Alface",
    "Batata Palha",
    "Cebola",
    "Cebolinha",
    "Milho",
    "Ovo",
    "Óleo",
    "Tomate"
  ]
};


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

  carregarSaldos();
  carregarDespesasGrafico();
});


// =======================
// LOGOUT
// =======================
document.getElementById("logoutAdmin")?.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});


// =======================
// CARREGAR SALDOS
// =======================
async function carregarSaldos() {
  const snap = await getDocs(collection(db, "motoboys"));

  let total = 0;
  snap.forEach((docu) => {
    total += Number(docu.data().saldo || 0);
  });

  document.getElementById("saldoGeral").innerText =
    "R$ " + total.toFixed(2).replace(".", ",");
}


// =======================
// SUBCATEGORIAS DINÂMICAS
// =======================
const categoriaSelect = document.getElementById("estoqueCategoria");
const itemSelect = document.getElementById("estoqueItem");
const dataInput = document.getElementById("estoqueData");
const filtroData = document.getElementById("filtroEstoqueData");
const listaEstoque = document.getElementById("listaEstoque");

// Preenchendo data de hoje automática
const hoje = new Date().toISOString().split("T")[0];
dataInput.value = hoje;
filtroData.value = hoje;

// Quando muda a categoria, preenche itens
categoriaSelect.addEventListener("change", () => {
  const cat = categoriaSelect.value;

  itemSelect.innerHTML = "";
  itemSelect.disabled = false;

  SUBCATEGORIAS[cat].forEach(item => {
    const opt = document.createElement("option");
    opt.value = item;
    opt.textContent = item;
    itemSelect.appendChild(opt);
  });
});


// =======================
// SALVAR ESTOQUE
// =======================
document.getElementById("btnSalvarEstoque")?.addEventListener("click", async () => {
  const categoria = categoriaSelect.value;
  const item = itemSelect.value;
  const qtd = document.getElementById("estoqueQtd").value.trim();
  const data = dataInput.value;

  if (!categoria || !item || !qtd || !data) {
    alert("Preencha todos os campos.");
    return;
  }

  await addDoc(collection(db, "estoque"), {
    categoria,
    item,
    quantidade: qtd,
    data,
    timestamp: new Date()
  });

  alert("Estoque salvo!");
  carregarListaEstoque();
});


// =======================
// LISTAGEM DO ESTOQUE
// =======================
filtroData.addEventListener("change", carregarListaEstoque);

async function carregarListaEstoque() {
  const dataProcurada = filtroData.value;

  listaEstoque.innerHTML = "Carregando...";

  const q = query(
    collection(db, "estoque"),
    where("data", "==", dataProcurada)
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    listaEstoque.innerHTML = "<p>Nenhum lançamento nesta data.</p>";
    return;
  }

  let html = "";
  snap.forEach((d) => {
    const e = d.data();
    html += `
      <div class="estoque-item">
        <strong>${e.categoria.toUpperCase()}</strong> — 
        ${e.item}: <span>${e.quantidade}</span>
      </div>
    `;
  });

  listaEstoque.innerHTML = html;
}


// =======================
// GRÁFICO DE DESPESAS
// =======================
async function carregarDespesasGrafico() {
  const snap = await getDocs(collection(db, "despesas"));

  let datas = [];
  let valores = [];

  snap.forEach((d) => {
    datas.push(d.data().data);
    valores.push(Number(d.data().valor));
  });

  const combinado = datas.map((d, i) => ({ d, v: valores[i] }))
    .sort((a, b) => a.d.localeCompare(b.d));

  datas = combinado.map(x => x.d);
  valores = combinado.map(x => x.v);

  new Chart(document.getElementById("graficoDespesas"), {
    type: "bar",
    data: {
      labels: datas,
      datasets: [{
        label: "Despesas (R$)",
        data: valores,
        backgroundColor: "#ffca28"
      }]
    }
  });
}