# **Plano de Desenvolvimento — CulturaPMW**

## **1. Visão geral do projeto**

O **CulturaPMW** é uma plataforma web voltada à divulgação e à centralização de eventos culturais, esportivos e de lazer em Palmas–TO.

A proposta é facilitar o acesso da população às informações sobre eventos da cidade, permitindo que produtores divulguem suas atividades e que administradores realizem o gerenciamento e a moderação do conteúdo publicado.

O desenvolvimento será realizado utilizando tecnologias simples e adequadas ao escopo acadêmico do projeto, alinhando o código-fonte diretamente ao **Diagrama de Classes** da modelagem por meio de uma camada de domínio orientada a objetos.

### **Tecnologias e Paradigma**

* **Vue.js 3:** desenvolvimento da interface.
* **TypeScript (com Orientação a Objetos):** modelagem das entidades de domínio (`src/models/`) e serviços (`src/services/`), garantindo rastreabilidade direta com o Diagrama de Classes.
* **Supabase:** autenticação, banco de dados PostgreSQL, views SQL e armazenamento de imagens.
* **Vue Router:** gerenciamento das rotas e navegação entre páginas.

## **2. Perfis de usuários**

A plataforma contará com três perfis principais:

### **2.1. Público geral**

Usuários que acessam a plataforma sem precisar criar uma conta.

Funcionalidades:

* Visualizar eventos disponíveis em ordem cronológica, além de atalhos rápidos ("O que fazer hoje" e "Neste final de semana").
* Pesquisar eventos por termo.
* Filtrar eventos por categoria, região de Palmas–TO e gratuidade.
* Consultar informações detalhadas dos eventos (incluindo links externos e rotas no Google Maps/Waze).
* Visualizar informações públicas dos produtores.

### **2.2. Produtor de eventos**

Usuários responsáveis por cadastrar e divulgar eventos na plataforma.

Funcionalidades:

* Solicitar cadastro como produtor.
* Aguardar aprovação do administrador.
* Acessar o painel do produtor após aprovação.
* Cadastrar novos eventos (com consulta opcional de endereço via API ViaCEP e identificação de região).
* Editar e gerenciar seus próprios eventos.
* Adicionar imagens e links externos dos eventos.
* Acompanhar os eventos cadastrados.

### **2.3. Administrador**

Responsável pelo gerenciamento e pela moderação da plataforma.

Funcionalidades:

* Aprovar ou rejeitar solicitações de produtores.
* Gerenciar produtores cadastrados (incluindo suspensão temporária e exclusão).
* Moderar eventos publicados (corrigir ou remover conteúdos).
* Gerenciar categorias de eventos.
* Gerenciar contas de usuários.

## **3. Planejamento das telas**

O desenvolvimento das interfaces será dividido em quatro áreas principais.

### **3.1. Área pública**

| Tela | Arquivo | Status | Descrição |
| :--- | :--- | :---: | :--- |
| Página inicial | `HomeView.vue` | Concluída | Apresentação da plataforma, atalhos rápidos e feed cronológico de eventos. |
| Busca e filtros | `EventosFiltros.vue` | Concluída | Pesquisa por termo e filtros por categoria, região e gratuidade. |
| Detalhes do evento | `EventoDetalhesView.vue` | Concluída | Informações completas sobre um evento, links externos e links de mapa. |
| Perfil do produtor | `ProdutorPerfilView.vue` | Concluída | Informações públicas sobre o responsável pelo evento e suas atrações. |

### **3.2. Área de autenticação**

| Tela | Descrição |
| :--- | :--- |
| Login | Acesso à plataforma. |
| Cadastro de produtor | Solicitação de registro como produtor. |
| Recuperação de senha | Recuperação do acesso à conta. |
| Aguardando aprovação | Informações sobre a situação da solicitação do produtor. |

### **3.3. Área do produtor**

| Tela | Descrição |
| :--- | :--- |
| Painel do produtor | Visão geral dos eventos cadastrados. |
| Meus eventos | Listagem dos eventos do produtor. |
| Cadastro de evento | Formulário para criação de eventos. |
| Edição de evento | Alteração das informações de um evento. |
| Perfil do produtor | Gerenciamento das informações públicas. |

### **3.4. Área administrativa**

| Tela | Descrição |
| :--- | :--- |
| Painel administrativo | Visão geral da plataforma. |
| Gerenciamento de produtores | Aprovação e gerenciamento de produtores. |
| Moderação de eventos | Análise e gerenciamento dos eventos. |
| Gerenciamento de categorias | Cadastro, edição e exclusão de categorias. |
| Gerenciamento de usuários | Administração das contas cadastradas. |

## **4. Planejamento do banco de dados**

O Supabase será utilizado como solução de backend, evitando a necessidade de desenvolver uma API própria.

### **Tabelas e Views**

| Objeto | Tipo | Responsabilidade |
| :--- | :--- | :--- |
| `profiles` | Tabela | Armazenar informações básicas dos usuários (`id`, `nome`, `email`, `role`). |
| `produtores` | Tabela | Armazenar dados específicos dos produtores (`cpf_cnpj`, `telefone`, `status`, `suspenso_ate`). |
| `categorias` | Tabela | Armazenar as categorias disponíveis para classificação dos eventos. |
| `regioes` | Tabela | Armazenar as regiões administrativas/geográficas de Palmas–TO. |
| `eventos` | Tabela | Armazenar os dados dos eventos cadastrados, valores e situação (`ATIVO`, `CONCLUIDO`, `OCULTO`). |
| `localizacoes` | Tabela | Armazenar os endereços dos eventos e sua associação com a região de Palmas–TO. |
| `links_externos` | Tabela | Armazenar links externos vinculados aos eventos (ingressos, divulgação, contato). |
| `vw_eventos_publicos` | View | Consolidar eventos públicos válidos, aplicando automaticamente o status concluído e a regra de remoção 24h após o encerramento. |

### **Relacionamentos principais**

* Um perfil (`profiles`) está associado 1:1 a um produtor (`produtores`).
* Um produtor pode cadastrar vários eventos (`eventos`).
* Uma categoria (`categorias`) classifica vários eventos.
* Cada evento possui uma localização (`localizacoes`) vinculada a uma região (`regioes`).
* Cada evento pode possuir múltiplos links externos (`links_externos`).

### **Serviços do Supabase**

* **Supabase Auth:** autenticação e gerenciamento de contas.
* **Supabase Database:** armazenamento relacional e regras de visibilidade via `vw_eventos_publicos`.
* **Supabase Storage:** armazenamento das imagens dos eventos no bucket público `eventos-imagens`.
* **Row Level Security (RLS):** controle de acesso aos dados garantindo que produtores gerenciem apenas seus próprios eventos e administradores tenham acesso às operações de moderação.

## **5. Identidade visual**

A identidade visual do CulturaPMW será baseada em uma paleta predominantemente azul, transmitindo confiança, organização e identidade institucional.

### **Paleta de cores**

| Cor | Código | Aplicação |
| :--- | :--- | :--- |
| Azul principal | `#1154D9` | Botões principais e elementos de destaque. |
| Azul secundário | `#114BBF` | Estados de interação e elementos secundários. |
| Azul escuro | `#08428C` | Cabeçalho, rodapé e elementos de maior destaque. |
| Azul de destaque | `#117CD9` | Links, ícones e detalhes visuais. |
| Cinza claro | `#F2F2F2` | Fundo das páginas. |
| Branco | `#FFFFFF` | Cartões, formulários e superfícies. |

Também serão utilizadas cores complementares para textos, bordas e informações secundárias definidas em `src/assets/styles/variables.css`.

### **Diretrizes visuais**

* Interface simples e intuitiva.
* Layout responsivo para computadores e dispositivos móveis.
* Cartões para apresentação dos eventos.
* Hierarquia visual clara.
* Formulários objetivos.
* Componentes reutilizáveis.
* Padronização de cores, espaçamentos e tipografia.

## **6. Organização do projeto**

A estrutura atual do código segue uma organização orientada a objetos e separada por responsabilidade:

```text
src/
├── assets/
│   └── styles/
│       └── variables.css       # Paleta de cores e variáveis globais
│
├── models/                     # Classes de domínio (alinhadas ao Diagrama de Classes)
│   ├── Usuario.ts              # Classe abstrata base
│   ├── Produtor.ts             # Herda de Usuario
│   ├── Administrador.ts        # Herda de Usuario
│   ├── Categoria.ts
│   ├── Regiao.ts
│   ├── Endereco.ts             # Encapsula endereço e geração de links de mapa
│   ├── LinkExterno.ts
│   └── Evento.ts               # Regras de visibilidade e conclusão automática
│
├── services/                   # Camada de integração e persistência
│   ├── supabase.ts             # Cliente Supabase
│   ├── EventoService.ts        # Consultas públicas e hidratação de objetos Evento/Produtor
│   └── ServicoCEP.ts           # Interface ServicoCEP e integração ViaCEP
│
├── components/
│   ├── layout/                 # PublicLayout, AppHeader, AppFooter
│   ├── eventos/                # EventoCard, EventosFiltros
│   ├── formularios/            # (Etapas 3 e 4)
│   └── ui/                     # (Etapas 3 a 5)
│
├── views/
│   ├── public/                 # HomeView, EventoDetalhesView, ProdutorPerfilView
│   ├── auth/                   # (Etapa 3)
│   ├── produtor/               # (Etapas 3 e 4)
│   └── admin/                  # (Etapa 5)
│
├── router/                     # Configuração das rotas
├── composables/                # (Etapa 3)
├── stores/                     # (Opcional)
│
├── App.vue
└── main.ts
```

## **7. Etapas de desenvolvimento**

O desenvolvimento foi dividido em seis etapas incrementais:

### **Etapa 1 — Preparação do projeto, banco de dados e domínio (Concluída)**

Objetivo: preparar a estrutura inicial da aplicação, o banco de dados e a camada orientada a objetos.

Atividades:

* [x] Configurar o projeto Vue.js com TypeScript e Vite.
* [x] Instalar e configurar o Vue Router.
* [x] Configurar o projeto no Supabase (tabelas, enums, `vw_eventos_publicos`, políticas RLS e bucket `eventos-imagens`).
* [x] Configurar variáveis de ambiente (`.env` e `.env.example`) e cliente `supabase.ts`.
* [x] Criar as variáveis globais de cores (`variables.css`) e estilos base.
* [x] Implementar as classes de domínio em `src/models/` (`Usuario`, `Produtor`, `Administrador`, `Categoria`, `Regiao`, `Endereco`, `LinkExterno`, `Evento`).
* [x] Implementar os serviços iniciais (`EventoService.ts` e `ServicoCEP.ts`) e atualizar a documentação (`README.md`).

### **Etapa 2 — Desenvolvimento da área pública (Concluída)**

Objetivo: permitir que qualquer pessoa consulte os eventos disponíveis.

Atividades:

* [x] Criar a estrutura base de layout (`PublicLayout.vue`, `AppHeader.vue` e `AppFooter.vue`).
* [x] Criar os componentes de card (`EventoCard.vue`) e filtros (`EventosFiltros.vue`).
* [x] Conectar a página inicial (`HomeView.vue`) ao `EventoService` com atalhos ("O que fazer hoje" e "Neste final de semana") e filtros combinados.
* [x] Criar a página de detalhes do evento (`EventoDetalhesView.vue`) com links externos e rotas para Google Maps/Waze.
* [x] Desenvolver a apresentação do perfil público dos produtores (`ProdutorPerfilView.vue`).
* [x] Registrar rotas públicas no Vue Router e adaptar as telas públicas para dispositivos móveis.

### **Etapa 3 — Autenticação e área do produtor (Próxima etapa)**

Objetivo: permitir que produtores solicitem acesso e gerenciem suas atividades.

Atividades:

* [ ] Configurar políticas RLS de inserção/atualização em `profiles` e `produtores` no Supabase.
* [ ] Implementar cadastro, login, logout e recuperação de senha com Supabase Auth (`AuthService.ts` e `useAuth.ts`).
* [ ] Criar o formulário de solicitação de cadastro como produtor (`CadastroProdutorView.vue`).
* [ ] Implementar o fluxo de verificação de status (`AGUARDANDO_APROVACAO`, `APROVADO`, `REPROVADO`, `SUSPENSO`).
* [ ] Criar a tela de aguardando aprovação (`AguardandoAprovacaoView.vue`) e login (`LoginView.vue`).
* [ ] Desenvolver o painel do produtor (`PainelProdutorView.vue`) e a edição de perfil (`EditarPerfilProdutorView.vue`).
* [ ] Implementar guardas de rota (`navigation guards`) no Vue Router para controle de acesso às áreas restritas.

### **Etapa 4 — Gerenciamento de eventos**

Objetivo: permitir o cadastro e o gerenciamento dos eventos pelos produtores aprovados.

Atividades:

* [ ] Criar o formulário de cadastro de eventos com preenchimento automático de endereço via `ViaCepService`.
* [ ] Implementar edição e exclusão de eventos.
* [ ] Integrar o envio de imagens ao Supabase Storage (`eventos-imagens`).
* [ ] Gerenciar os vínculos com categorias, regiões e links externos.
* [ ] Implementar validações dos formulários.

### **Etapa 5 — Área administrativa**

Objetivo: disponibilizar ferramentas para gerenciamento e moderação da plataforma.

Atividades:

* [ ] Criar o painel administrativo (`AdminService.ts`).
* [ ] Implementar aprovação e rejeição de solicitações de produtores.
* [ ] Criar a tela de gerenciamento de produtores (suspensão temporária e exclusão).
* [ ] Implementar moderação de eventos (correção e remoção).
* [ ] Criar o gerenciamento de categorias (CRUD).
* [ ] Garantir as permissões administrativas via RLS no Supabase.

### **Etapa 6 — Finalização e testes**

Objetivo: revisar a aplicação e preparar uma versão funcional para apresentação.

Atividades:

* [ ] Revisar a navegação entre as páginas.
* [ ] Testar os fluxos de autenticação e permissões de cada perfil.
* [ ] Testar o ciclo completo de cadastro, edição, conclusão automática e expiração (24h) de eventos.
* [ ] Implementar estados de carregamento, erro e ausência de dados em todas as telas.
* [ ] Revisar a responsividade e alinhar os protótipos/telas finais com a Documentação de Modelagem.

## **8. Metodologia de implementação**

Para evitar desenvolver muitas funcionalidades simultaneamente, cada tela seguirá um processo incremental:

1. **Planejamento:** definir o objetivo da tela e seus elementos.
2. **Estrutura:** desenvolver o layout utilizando Vue.js.
3. **Estilização:** aplicar a identidade visual do projeto.
4. **Responsividade:** adaptar a interface para diferentes tamanhos de tela.
5. **Comportamento:** implementar interações e validações.
6. **Integração:** conectar a tela aos serviços orientados a objetos e ao Supabase.
7. **Testes:** verificar o funcionamento antes de avançar.

Durante o desenvolvimento, serão priorizadas soluções simples, evitando bibliotecas e estruturas desnecessárias para o escopo do trabalho.

## **9. Resultado esperado**

Ao final do desenvolvimento, esperamos ter uma aplicação web funcional que permita:

* Ao público, descobrir e consultar eventos culturais, esportivos e de lazer em Palmas.
* Aos produtores aprovados, cadastrar e gerenciar seus eventos.
* Aos administradores, controlar o acesso de produtores e moderar o conteúdo da plataforma.

A aplicação será desenvolvida com Vue.js, TypeScript (POO) e Supabase, mantendo uma arquitetura simples, organizada e fiel à modelagem acadêmica.