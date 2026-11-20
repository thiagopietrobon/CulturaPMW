<div align="center">

# 🎭 CulturaPMW
### Agenda Cultural, Esportiva e de Lazer de Palmas – TO

[![Vue.js](https://img.shields.io/badge/Vue.js-3.x-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-BaaS-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Status](https://img.shields.io/badge/Status-Em%20Desenvolvimento-1154D9?style=for-the-badge)](#)

*Conectando produtores culturais e o público de Palmas em um só lugar.* 🌴☀️

</div>

---

## 📖 Sobre o Projeto

O **CulturaPMW** é uma plataforma web desenvolvida para centralizar, organizar e divulgar eventos culturais, esportivos e de lazer realizados em **Palmas – Tocantins**. A aplicação elimina a dispersão de informações em redes sociais, oferecendo ao cidadão uma agenda confiável e filtrável, enquanto fornece aos produtores e administradores ferramentas completas de publicação e moderação.

---

## ✨ Funcionalidades por Perfil

<table>
  <tr>
    <td valign="top" width="33%">
      <h3>🎟️ Público Geral</h3>
      <ul>
        <li>📅 Feed cronológico de eventos ativos</li>
        <li>⚡ Atalhos <b>"O que fazer hoje"</b> e <b>"Neste final de semana"</b></li>
        <li>🔍 Busca por termo e filtros por categoria, região e gratuidade</li>
        <li>🗺️ Rotas diretas via <b>Google Maps</b> e <b>Waze</b></li>
        <li>🔗 Links para ingressos e canais oficiais</li>
        <li>👤 Visualização do perfil público do produtor</li>
      </ul>
    </td>
    <td valign="top" width="33%">
      <h3>🎤 Produtor de Eventos</h3>
      <ul>
        <li>📝 Solicitação de cadastro com validação administrativa</li>
        <li>➕ Publicação, edição e exclusão dos próprios eventos</li>
        <li>📮 Preenchimento automático de endereço via <b>ViaCEP</b></li>
        <li>🖼️ Upload de banners e artes promocionais</li>
        <li>📊 Acompanhamento da situação dos eventos</li>
      </ul>
    </td>
    <td valign="top" width="33%">
      <h3>🛡️ Administrador</h3>
      <ul>
        <li>✅ Aprovação ou reprovação de novos produtores</li>
        <li>⏸️ Suspensão temporária ou remoção de contas</li>
        <li>🧹 Moderação e remoção de eventos irregulares</li>
        <li>🏷️ Gerenciamento completo de categorias</li>
        <li>⏱️ Encerramento automático e ocultação 24h após o fim</li>
      </ul>
    </td>
  </tr>
</table>

---

## 🏗️ Arquitetura e Tecnologias

O projeto adota **Programação Orientada a Objetos (POO)** no TypeScript (`src/models/`), espelhando diretamente o **Diagrama de Classes** da modelagem de software (herança, encapsulamento e regras de domínio) integrado ao ecossistema do **Supabase**.

* 🎨 **Frontend:** Vue 3 (Composition API) + TypeScript + Vite
* 🧭 **Roteamento:** Vue Router com *Navigation Guards*
* 🗄️ **Backend & Banco (BaaS):** Supabase (PostgreSQL, Views SQL, Auth, Storage e RLS)
* 📍 **API Externa:** ViaCEP para consulta de endereços em Palmas–TO

### 📂 Estrutura de Diretórios

```text
src/
├── assets/
│   └── styles/
│       └── variables.css   # 🎨 Paleta de cores e variáveis globais
├── components/
│   ├── eventos/            # 🃏 Cards e barra de filtros de eventos
│   └── layout/             # 🧩 Cabeçalho, rodapé e estrutura base
├── models/                 # 🏛️ Classes de domínio (Usuario, Produtor, Administrador, Evento, Endereco...)
├── router/                 # 🛣️ Rotas públicas e protegidas
├── services/               # 🔌 Integração com Supabase e ViaCEP
└── views/
    ├── public/             # 🌐 Agenda, detalhes do evento e perfil do produtor
    ├── auth/               # 🔐 Login e solicitação de cadastro
    ├── produtor/           # 📋 Painel e gestão de eventos do produtor
    └── admin/              # ⚙️ Moderação e administração da plataforma
```

---

## 🚀 Como Executar Localmente

### 1️⃣ Pré-requisitos
* **Node.js** `v22.22+` instalado
* Projeto configurado no **Supabase**

### 2️⃣ Clone e instale as dependências
```bash
git clone https://github.com/thiagopietrobon/culturapmw.git
cd culturapmw
npm install
```

### 3️⃣ Configure as variáveis de ambiente
Copie o arquivo de exemplo e preencha com as credenciais do seu painel Supabase (**Project Settings → Data API / API Keys**):

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://sua-url-do-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publishable-aqui
```

> [!IMPORTANT]
> Nunca utilize a chave `Secret` (`sb_secret_...`) no frontend. Utilize apenas a chave pública `Publishable` (`sb_publishable_...`).

### 4️⃣ Inicie o servidor de desenvolvimento
```bash
npm run dev
```

> [!TIP]
> A aplicação ficará disponível por padrão em `http://localhost:5173`.

---

## 👥 Equipe de Desenvolvimento

| Integrante | Papel no Projeto |
| :--- | :--- |
| 👨‍💻 **Thiago Henrique B. Pietrobon** | Líder do Projeto • Eng. de Software |
| 🎨 **Flávio J. L. Varnier** | Eng. de Software • UX & UI |
| ⚙️ **Anthonny C. S. Patrocinio** | Eng. de Software • Backend |
| 💻 **Pedro Arthur Souza Napp** | Desenvolvedor • UX & UI |
| 📋 **Lucas Cardoso Marinho** | Eng. de Software • Analista |
| 🚀 **Gabriel Oliveira Medeiros** | Desenvolvedor |

---

<div align="center">

🎓 *Projeto acadêmico desenvolvido para a disciplina de Modelagem de Software — Palmas, TO*

</div>
---

## 🛡️ Área administrativa

O acesso à plataforma é realizado pela tela única **`/login`**. Após a autenticação, o sistema identifica o perfil e direciona administradores ao painel administrativo e produtores à sua área correspondente. O painel administrativo contempla visão geral, gerenciamento de produtores, moderação de eventos e gerenciamento de categorias.

Antes do primeiro acesso, execute a migração `supabase/migrations/202611180001_admin_area.sql` no SQL Editor do Supabase e configure o perfil da conta responsável com `profiles.role = 'admin'`. Consulte [`docs/ADMIN_SETUP.md`](docs/ADMIN_SETUP.md) para o passo a passo.

## Cadastro e área do produtor

O fluxo de contas de produtores (RF01) utiliza o Supabase Auth e a migration `supabase/migrations/202611180002_rf01_contas_produtor.sql`. A migration deve ser executada depois do schema inicial e da migration administrativa. Ela cria o perfil e a solicitação pendente por trigger, restringe a leitura dos dados pessoais, disponibiliza a view pública `vw_produtores_publicos`, limita consultas públicas à `vw_eventos_publicos` e oferece a RPC de exclusão da própria conta.

No Supabase, configure em **Authentication → URL Configuration** os endereços de redirecionamento usados em desenvolvimento: `http://localhost:5173/login` e `http://localhost:5173/produtor/redefinir-senha`. Adicione também as URLs equivalentes do domínio publicado. Os caminhos antigos `/produtor/login` e `/admin/login` continuam redirecionando para a tela unificada por compatibilidade.

Consulte `docs/RF01_CADASTRO_PRODUTOR.md` para a sequência de migração e os detalhes do fluxo.
