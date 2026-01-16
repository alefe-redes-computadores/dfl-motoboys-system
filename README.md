# 🚴‍♂️ Painel do Motoboy — Da Família Lanches

Painel administrativo exclusivo para **motoboys** e **gestão interna** da lanchonete **Da Família Lanches (DFL)**.  
O sistema permite acompanhar entregas, controlar saldo, registrar pagamentos e manter total integração com o Firebase.

---

## 📌 Funcionalidades Principais

### 🔐 Autenticação e Controle de Acesso

- Login com **Firebase Authentication**
- Sessão persistente (mantém logado após recarregar)
- **Sistema de duplo painel**: controle automático de acesso por tipo de usuário
  - **Painel do Motoboy**: acesso exclusivo aos próprios pedidos, saldo e histórico
  - **Painel Administrativo**: acesso completo com relatórios gerenciais, visualização da área dos motoboys e controle total do sistema

---

### 📦 Gestão de Entregas

- Visualização de pedidos atribuídos ao motoboy
- Status de entrega em tempo real
- Identificação clara de pedidos pendentes e concluídos

---

### 💰 Controle Financeiro do Motoboy

- Cálculo automático da **taxa por entrega**
- Exibição do **saldo acumulado**
- Histórico de pagamentos registrados
- Registro de pagamento feito pelo administrador
- Atualização imediata do saldo após confirmação

---

### 🧾 Registro de Pagamentos

- Botão de **"Registrar pagamento do motoboy"**
- Confirmação visual de pagamento efetuado
- Saldo zerado corretamente após registro
- Histórico preservado no Firestore

---

### 🎨 Interface (UI/UX)

- Layout simples, direto e funcional
- Feedback visual para ações importantes
- Mensagens de sucesso, aviso e erro
- Design pensado para uso rápido no dia a dia

---

## 🧠 Tecnologias Utilizadas

- **HTML5**
- **CSS3**
- **JavaScript (Vanilla JS)**
- **Firebase**
  - Authentication
  - Firestore
- **PWA (Progressive Web App)**  
  - Pode ser instalado no celular
  - Funciona como aplicativo

---

## 📁 Estrutura Básica do Projeto

```
/
├── index.html
├── login.html
├── css/
│   └── style.css
├── js/
│   ├── auth.js
│   ├── painel.js
│   ├── pagamentos.js
│   └── firebase-config.js
├── imagens/
│   └── logo.png
└── manifest.json
```

> ⚠️ A estrutura pode variar conforme versões futuras.

---

## ⚙️ Configuração Inicial

1. Clone o repositório:

```bash
git clone https://github.com/seu-usuario/painel-motoboy-dfl.git
```

2. Configure o Firebase:
   - Crie um projeto no Firebase
   - Ative Authentication
   - Ative Firestore
   - Substitua as credenciais no arquivo `firebase-config.js`

3. Execute em ambiente local ou servidor:
   - Pode rodar direto via servidor estático
   - Recomendado usar HTTPS para recursos PWA

---

## 📱 PWA (Aplicativo Web)

- Pode ser instalado diretamente pelo navegador
- Não depende da Play Store
- Atualizações exigem nova build/cache refresh
- Ideal para uso rápido dos motoboys

---

## 🚧 Observações Importantes

**Alterações no código exigem:**
- Limpar cache do PWA
- Reinstalar o app, se necessário

**Push Notifications:**
- Somente após publicação na Play Store (no caso de APK)
- Para PWA, depende de configuração adicional de service worker

---

## 🛠️ Status do Projeto

- 🟢 Em uso ativo
- 🔧 Em constante melhoria e ajustes visuais
- 📌 Bugs visuais conhecidos estão sendo tratados sem comprometer a lógica

---

## 👨‍🍳 Projeto Relacionado

Este painel faz parte do ecossistema do site:

**🍔 Da Família Lanches (DFL)**

Sistema de pedidos, painel administrativo, motoboys e futura expansão para app Android.

---

## 📄 Licença

Projeto de uso interno.  
Distribuição ou reutilização apenas com autorização do responsável.

---

Desenvolvido com ❤️ para facilitar o dia a dia da equipe DFL.