// public/js/dashboard-admin.js
// Painel Administrativo – DFL

import { auth, db } from "./firebase-config-v2.js";

import {
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
  doc,
  addDoc,
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// =======================
// UIDs dos administradores
// =======================
const ADMINS = [
  "6YczX4gLpUStlBVdQOXWc3uEYGG2", // kalebhstanley650@gmail.com
  "LYu3M8gyRdMCqhE90vmH9Jh5Ksj1", // contato@dafamilialanches.com.br
  "plSHKV043gTpEYfx7I3TI6FsJG93", // vendas@dafamilialanches.com.br
  "zIfbMxD1SQNvtlX9y6YUsEz2TXC3"  // alefejohsefe@gmail.com
];

// =======================
// Autenticação / Roteamento
// =======================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  if (!ADMINS.includes(user.uid)) {
    alert("Acesso restrito a administradores.");
    window.location.href = "dashboard.html"; // painel do motoboy
    return;
  }

  try {
    await carregarSaldos();
    await carregarGraficoDespesas();
    configurarFormularios();
  } catch (e) {
    console.error("Erro ao carregar painel admin:", e);
  }
});

// Logout
document.getElementById("logoutAdmin")?.addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (e) {
    console.error("Erro ao deslogar admin:", e);
  }
  window.location.href = "index.html";
});

// =======================
// SALDOS – Motoboy + Geral
// =======================
async function carregarSaldos() {
  const saldoLucasEl = document.getElementById("saldo_lucas_hiago");
  const saldoGeralEl = document.getElementById("saldoGeral");

  let total = 0;

  const snap = await getDocs(collection(db, "motoboys"));

  snap.forEach((docSnap) => {
    const dados = docSnap.data();
    const saldo = Number(dados.saldo || 0);

    total += saldo;

    // Atualiza linha do Lucas Hiago
    if (docSnap.id === "lucas_hiago" && saldoLucasEl) {
      atualizarSaldoVisual(saldoLucasEl, saldo);
    }
  });

  if (saldoGeralEl) {
    atualizarSaldoVisual(saldoGeralEl, total);
  }
}

// valor > 0 = dívida com motoboy => vermelho
function atualizarSaldoVisual(el, valor) {
  const numero = Number(valor || 0);
  const texto = `R$ ${numero.toFixed(2).replace(".", ",")}`;

  el.textContent = texto;
  el.classList.remove("positivo", "negativo", "neutral");

  if (numero > 0) {
    el.classList.add("negativo"); // empresa deve ao motoboy
  } else if (numero < 0) {
    el.classList.add("positivo"); // empresa está “no verde”
  } else {
    el.classList.add("neutral");
  }
}

// =======================
// FORMULÁRIOS
// =======================
function configurarFormularios() {
  configurarFormularioDespesas();
  configurarFormularioEstoque();
  configurarFormularioEntregas();
  configurarBotaoPdfEstoque();
}

// ----------  DESPESAS  ----------
function configurarFormularioDespesas() {
  const btn = document.getElementById("btnSalvarDespesa");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    const desc = document.getElementById("descDespesa").value.trim();
    const valor = Number(
      (document.getElementById("valorDespesa").value || "0").replace(",", ".")
    );
    const data = document.getElementById("dataDespesa").value;

    if (!desc || !data || !valor) {
      alert("Preencha descrição, valor e data.");
      return;
    }

    try {
      await addDoc(collection(db, "despesas"), {
        desc,
        valor,
        data,
        timestamp: new Date()
      });

      alert("Despesa registrada com sucesso!");

      document.getElementById("descDespesa").value = "";
      document.getElementById("valorDespesa").value = "";
      document.getElementById("dataDespesa").value = "";

      await carregarGraficoDespesas();
    } catch (e) {
      console.error("Erro ao salvar despesa:", e);
      alert("Erro ao salvar despesa.");
    }
  });
}

// ----------  ESTOQUE  ----------
const MAPA_ITENS = {
  frios: [
    "Bacon",
    "Carne Moida/Artesanais",
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
    "Del Valle 450ml Laranja",
    "Del Valle 450ml Uva",
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
  paes: [
    "Hambúrguer",
    "Hot Dog"
  ],
  outros: [
    "Alface",
    "Batata Palha",
    "Cebola",
    "Cebolinha",
    "Milho",
    "Oleo",
    "Ovo",
    "Tomate"
  ]
};

function configurarFormularioEstoque() {
  const selCategoria = document.getElementById("estoqueCategoria");
  const selItem = document.getElementById("estoqueItem");
  const btnSalvar = document.getElementById("btnSalvarEstoque");

  if (!selCategoria || !selItem || !btnSalvar) return;

  // Preenche itens conforme categoria
  function atualizarItens() {
    const cat = selCategoria.value;
    const lista = MAPA_ITENS[cat] || [];
    selItem.innerHTML = "";

    lista.forEach((item) => {
      const opt = document.createElement("option");
      opt.value = item;
      opt.textContent = item;
      selItem.appendChild(opt);
    });
  }

  selCategoria.addEventListener("change", atualizarItens);
  atualizarItens(); // primeira carga

  btnSalvar.addEventListener("click", async () => {
    const categoria = selCategoria.value;
    const item = selItem.value;
    const quantidade = document.getElementById("estoqueQtd").value.trim();
    const data = document.getElementById("estoqueData").value;

    if (!categoria || !item || !quantidade || !data) {
      alert("Preencha categoria, item, quantidade e data.");
      return;
    }

    try {
      await addDoc(collection(db, "estoque"), {
        categoria,
        item,
        quantidade,
        data,
        timestamp: new Date()
      });

      alert("Estoque registrado!");
      document.getElementById("estoqueQtd").value = "";
    } catch (e) {
      console.error("Erro ao salvar estoque:", e);
      alert("Erro ao salvar estoque.");
    }
  });
}

// ----------  ENTREGAS MANUAIS  ----------
function configurarFormularioEntregas() {
  const btn = document.getElementById("btnSalvarEntregaManual");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    const motoboy = document.getElementById("entregaMotoboy").value;
    const qtd = Number(document.getElementById("entregaQtd").value || 0);
    const data = document.getElementById("entregaData").value;

    if (!motoboy || !qtd || !data) {
      alert("Preencha motoboy, quantidade e data.");
      return;
    }

    try {
      await addDoc(collection(db, "entregasManuais"), {
        motoboy,
        qtd,
        data,
        timestamp: new Date()
      });

      alert("Entrega registrada!");
      document.getElementById("entregaQtd").value = "";
    } catch (e) {
      console.error("Erro ao salvar entrega manual:", e);
      alert("Erro ao salvar entrega.");
    }
  });
}

// =======================
// GRÁFICO DE DESPESAS
// =======================
async function carregarGraficoDespesas() {
  const canvas = document.getElementById("graficoDespesas");
  if (!canvas) return;

  const snap = await getDocs(collection(db, "despesas"));

  let datas = [];
  let valores = [];

  snap.forEach((d) => {
    const dado = d.data();
    datas.push(dado.data);
    valores.push(Number(dado.valor || 0));
  });

  const combinado = datas.map((d, i) => ({ d, v: valores[i] }))
    .sort((a, b) => a.d.localeCompare(b.d));

  datas = combinado.map(x => x.d);
  valores = combinado.map(x => x.v);

  // eslint-disable-next-line no-undef
  new Chart(canvas, {
    type: "bar",
    data: {
      labels: datas,
      datasets: [{
        label: "Despesas (R$)",
        data: valores,
        backgroundColor: "#ffca28"
      }]
    },
    options: {
      responsive: true
    }
  });
}

// =======================
// GERAR PDF – ESTOQUE DO DIA
// =======================
function configurarBotaoPdfEstoque() {
  const btnPdf = document.getElementById("btnGerarPdfEstoque");
  if (!btnPdf) return;

  btnPdf.addEventListener("click", async () => {
    const data = document.getElementById("estoqueData").value;

    if (!data) {
      alert("Escolha uma data para gerar o PDF do estoque.");
      return;
    }

    try {
      const qEstoque = query(
        collection(db, "estoque"),
        where("data", "==", data)
      );
      const snap = await getDocs(qEstoque);

      if (snap.empty) {
        alert("Não há registros de estoque para essa data.");
        return;
      }

      const linhas = [];
      snap.forEach((docu) => {
        const { categoria, item, quantidade } = docu.data();
        linhas.push({ categoria, item, quantidade });
      });

      linhas.sort((a, b) =>
        (a.categoria + a.item).localeCompare(b.categoria + b.item)
      );

      // jsPDF via CDN (UMD)
      const jsPDFLib = window.jspdf?.jsPDF;
      if (!jsPDFLib) {
        console.warn("jsPDF não carregado. Abrindo visualização simples.");
        let texto = `Estoque do dia ${data}\n\n`;
        linhas.forEach((l) => {
          texto += `${l.categoria} - ${l.item}: ${l.quantidade}\n`;
        });
        const win = window.open("", "_blank");
        win.document.write(`<pre>${texto}</pre>`);
        win.print();
        return;
      }

      const docPdf = new jsPDFLib();
      docPdf.setFontSize(14);
      docPdf.text(`Estoque do dia ${data}`, 10, 15);

      docPdf.setFontSize(11);
      let y = 25;

      linhas.forEach((l) => {
        const line = `${l.categoria} - ${l.item}: ${l.quantidade}`;
        docPdf.text(line, 10, y);
        y += 7;
        if (y > 280) {
          docPdf.addPage();
          y = 20;
        }
      });

      docPdf.save(`estoque-${data}.pdf`);
    } catch (e) {
      console.error("Erro ao gerar PDF de estoque:", e);
      alert("Erro ao gerar PDF.");
    }
  });
}