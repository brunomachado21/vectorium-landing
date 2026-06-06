# Documento de Requisitos — Vectorium / Metricora Web App

**Versão:** 1.5  
**Data:** 2026-06-05  
**Responsável:** Bruno Machado  
**Repositório de landing:** [vectorium-landing](https://github.com/brunomachado21/vectorium-landing)  
**URL produção:** https://vectorium.tec.br/app

---

## 1. Visão Geral

O Metricora Web App é a versão Flutter Web do aplicativo Metricora, servida em `vectorium.tec.br/app`. Ele permite que empreendedores registrem vendas, despesas, gerem DRE e acompanhem métricas financeiras diretamente no navegador, sem instalação.

A **landing page** (`vectorium.tec.br`) é um site estático HTML/CSS/JS hospedado no GitHub Pages e serve como principal canal de aquisição de usuários. O acesso ao produto ocorre por dois caminhos distintos: **APK Android** (offline-first, instalado no dispositivo) e **Versão Web** (no navegador, requer internet para carga inicial).

---

## 2. Stakeholders

| Papel | Nome / Descrição |
|---|---|
| Product Owner | Bruno Machado |
| Usuário final | Empreendedores individuais (vendedores, confeiteiros, barbeiros, etc.) |
| Plataforma | Flutter Web (Dart compilado para JS) |
| Backend | Supabase (Auth + PostgreSQL) |

---

## 3. Requisitos Funcionais

### 3.1 Autenticação

| ID | Requisito | Prioridade |
|---|---|---|
| RF-01 | Permitir **login** com e-mail e senha via Supabase Auth | Alta |
| RF-02 | Permitir **cadastro** de novo usuário com nome, e-mail e senha | Alta |
| RF-03 | Tela de cadastro com **mesmo layout visual** da tela de login | Alta |
| RF-04 | Após cadastro bem-sucedido, redirecionar para o painel principal | Alta |
| RF-05 | Exibir mensagem de erro clara em caso de e-mail já cadastrado ou senha fraca | Média |
| RF-06 | Permitir **recuperação de senha** via e-mail | Média |
| RF-39 | No web, `null` retornado por `GoogleAuthHelper.entrar()` **não deve ser tratado como erro** — indica redirect OAuth em andamento | Alta |
| RF-40 | `SplashRouter` deve resolver a sessão ativa (Supabase Auth ou SharedPreferences) **antes de renderizar qualquer tela**, eliminando flash da LandingScreen no F5 | Alta |

### 3.2 Painel Principal (Dashboard)

| ID | Requisito | Prioridade |
|---|---|---|
| RF-07 | Exibir cards de resumo: receita total, lucro, CPV, margem | Alta |
| RF-08 | Permitir lançamento de venda/despesa via formulário | Alta |
| RF-09 | Listar registros recentes com paginação | Alta |
| RF-10 | Filtros por período: Hoje, Mês, Geral | Alta |

### 3.3 Contabilidade / DRE

| ID | Requisito | Prioridade |
|---|---|---|
| RF-11 | Exibir DRE mensal simplificado | Alta |
| RF-12 | Exportar DRE em PDF | Média |
| RF-13 | Gráfico de evolução 6 meses | Média |

### 3.4 Banco de Dados Local (Web WASM)

| ID | Requisito | Prioridade |
|---|---|---|
| RF-14 | Na versão Web, usar **Drift + sqlite3.wasm** como banco local no browser (IndexedDB via WASM) | Alta |
| RF-15 | Sincronizar dados locais com Supabase após login (push + pull com LWW) | Alta |
| RF-16 | O arquivo `sqlite3.wasm` deve ser servido em `/app/sqlite3.wasm` (path absoluto) | Alta |
| RF-17 | O arquivo `drift_worker.dart.js` deve ser servido em `/app/drift_worker.dart.js` | Alta |

### 3.5 PWA (Progressive Web App)

| ID | Requisito | Prioridade |
|---|---|---|
| RF-18 | O app deve ser instalável como PWA em desktop e mobile | Média |
| RF-19 | O manifest.json deve referenciar ícones PNG válidos 192×192 e 512×512 | Alta |
| RF-20 | Ícones definitivos com logo da marca devem substituir os placeholders | Média |

### 3.6 Segurança (CSP)

| ID | Requisito | Prioridade |
|---|---|---|
| RF-21 | O `index.html` deve ter `Content-Security-Policy` que permita `'wasm-unsafe-eval'` (Drift/WASM) | Alta |
| RF-22 | O CSP deve liberar `accounts.google.com` e `*.googleapis.com` para Google Sign-In | Alta |
| RF-23 | O CSP deve liberar `*.supabase.co` (HTTP + WSS) para conexões com o backend | Alta |

### 3.7 Landing Page — Navbar

| ID | Requisito | Prioridade |
|---|---|---|
| RF-24 | Navbar com links de navegação à esquerda/centro, incluindo link "Como Acessar" apontando para `#acesso` | Alta |
| RF-25 | Dois botões no canto direito: **"Versão Web"** (outline azul) e **"Baixar para Android"** (gradiente) | Alta |
| RF-26 | Botão de download especifica explicitamente **Android** | Média |
| RF-27 | Em mobile (≤ 700px): botão "Versão Web" oculto; apenas CTA de download | Média |

### 3.8 Landing Page — Arquitetura de Seções

| ID | Requisito | Prioridade |
|---|---|---|
| RF-28 | Exibir bloco **"Escolha de acesso"** (`#acesso`) logo após o hero com dois cards: Android APK e Versão Web | Alta |
| RF-29 | Seção de screenshots (`#screenshots`) deve ser exibida antes das funcionalidades completas para antecipar prova de produto | Média |
| RF-30 | Depoimentos (`#depoimentos`) devem aparecer antes da seção de pricing para reforçar prova social | Média |
| RF-31 | Ordem das seções: Hero → Acesso → Screenshots → Features → Segmentos → Depoimentos → Pricing → FAQ → CTA Final | Alta |
| RF-32 | O subtexto do hero deve comunicar os dois canais de acesso: "no navegador ou no seu Android" | Média |
| RF-33 | Trust row deve distinguir explicitamente: "Offline no Android via APK" e "Web no navegador" — sem afirmação genérica de offline | Alta |

### 3.9 Landing Page — Diferenciação APK vs Web

| ID | Requisito | Prioridade |
|---|---|---|
| RF-34 | Card Android APK deve comunicar: funciona **offline de verdade**, dados locais no dispositivo | Alta |
| RF-35 | Card Versão Web deve comunicar: sem instalação, requer internet para carga inicial, acesso em qualquer dispositivo | Alta |
| RF-36 | Feature card de "offline" deve ser específico ao Android APK, não afirmar offline genérico para todos | Alta |
| RF-37 | FAQ deve conter pergunta específica sobre diferença entre APK Android e Versão Web | Média |
| RF-38 | FAQ deve conter pergunta sobre funcionamento offline com resposta diferenciada por modo de acesso | Média |

---

## 4. Requisitos Não Funcionais

| ID | Requisito | Categoria |
|---|---|---|
| RNF-01 | Interface responsiva (mínimo 320px) | Usabilidade |
| RNF-02 | Tema escuro consistente — sem hardcodes de cor, usar `AppConfigs.*` | Manutenibilidade |
| RNF-03 | TTI < 5s em conexão 4G | Performance |
| RNF-04 | Autenticação por HTTPS (Supabase + CNAME vectorium.tec.br) | Segurança |
| RNF-05 | Dados isolados por `user_id` em todas as queries (RLS ativo) | Segurança |
| RNF-06 | Build Flutter Web com tree-shaking e minificação | Performance |
| RNF-07 | Landing page sem dependências JS externas além de Tailwind CDN e Phosphor Icons | Manutenibilidade |
| RNF-08 | CI/CD automatizado: todo push em `main` deve disparar build + deploy via GitHub Actions | Infraestrutura |
| RNF-09 | Os arquivos `sqlite3.wasm` e `drift_worker.dart.js` devem estar presentes em `build/web/` no deploy | Infraestrutura |
| RNF-10 | Deploy deve ser idempotente: se não houver mudanças, nenhum commit será gerado | Infraestrutura |
| RNF-11 | Sessão do usuário deve **persistir no reload (F5)** — `SplashRouter` resolve antes de renderizar UI | Usabilidade |

---

## 5. Correções & Melhorias

| ID | Descrição | Status |
|---|---|---|
| FIX-01 | `RegisterScreen` — layout deve ser idêntico ao `LoginScreen` | 🔴 Pendente |
| FIX-02 | Hardcodes de cor em `historico_tab.dart` | ✅ 04/06/2026 |
| FIX-03 | Hardcodes de cor em `backup_screen.dart` | ✅ 04/06/2026 |
| FIX-04 | Hardcodes de cor em `contabilidade_screen.dart` | ✅ 04/06/2026 |
| FIX-05 | Hardcodes de cor em `atacadistas_screen.dart` | ✅ 04/06/2026 |
| FIX-06 | Revert redesign completo do `index.html` | ✅ 04/06/2026 |
| FIX-07 | Navbar landing: "Versão Web" como botão + especificar Android | ✅ 04/06/2026 |
| FIX-08 | `sqlite3.wasm` 404 — URI relativa ignorava `base-href` no Web Worker | ✅ 04/06/2026 |
| FIX-09 | CSP bloqueava `accounts.google.com` → Google Sign-In inoperante | ✅ 04/06/2026 |
| FIX-10 | Ícones PWA corrompidos (80/44 bytes) — substituídos por PNGs válidos | ✅ 04/06/2026 |
| FIX-11 | `drift_worker.dart.js` ausente no deploy — workflow não gerava o arquivo | ✅ 04/06/2026 |
| FIX-12 | `LateInitializationError` em cascata no login (efeito do banco falhando) | ✅ 04/06/2026 |
| FIX-13 | Ícones PWA definitivos com logo da marca | 🔴 Pendente |
| FIX-14 | Script SQL de migration Supabase (campos V12+ ausentes no schema remoto) | 🔴 Pendente |
| FIX-15 | Arquitetura de seções da landing reorganizada: bloco acesso, screenshots antecipadas, depoimentos antes do pricing | ✅ 05/06/2026 |
| FIX-16 | Promessa offline corrigida: APK Android (offline real) vs Versão Web (requer internet) diferenciados em toda landing | ✅ 05/06/2026 |
| FIX-17 | FAQ atualizado com perguntas de diferenciação APK vs Web e comportamento offline por modo | ✅ 05/06/2026 |
| FIX-18 | `null` retornado pelo Google OAuth no web tratado erroneamente como cancelamento — exibia "Login cancelado" antes da seleção de conta | ✅ 05/06/2026 |
| FIX-19 | F5 destruía sessão ativa — app sempre renderizava LandingScreen antes de resolver sessão; `SplashRouter` adicionado | ✅ 05/06/2026 |

---

## 6. Critérios de Aceite — Banco WASM (RF-14 a RF-17)

- [x] `vectorium.tec.br/app/sqlite3.wasm` responde 200
- [x] `vectorium.tec.br/app/drift_worker.dart.js` responde 200
- [x] Console do browser sem erros de 404 WASM
- [x] Banco local persiste dados entre sessões (IndexedDB via Drift WASM)
- [x] Login por e-mail funciona sem `LateInitializationError`

## 7. Critérios de Aceite — CSP (RF-21 a RF-23)

- [x] Google Sign-In carrega sem bloqueio de CSP
- [x] Supabase (HTTP + WebSocket) sem bloqueio de CSP
- [x] WASM executa sem bloqueio (`wasm-unsafe-eval`)
- [x] Fontes Google carregam normalmente

## 8. Critérios de Aceite — PWA (RF-18 a RF-20)

- [x] Ícone 192×192 válido — sem erro no Manifest
- [x] Ícone 512×512 válido
- [ ] Ícones definitivos com logo da marca (pendente)
- [ ] PWA instalável sem avisos no browser

## 9. Critérios de Aceite — Landing Arquitetura (RF-28 a RF-38)

- [x] Bloco "Escolha de acesso" exibido logo após o hero com cards Android e Web
- [x] Screenshots aparecem antes das funcionalidades
- [x] Depoimentos aparecem antes do pricing
- [x] Trust row distingue APK offline vs Web com internet
- [x] Feature card offline específico para APK Android
- [x] FAQ com pergunta de diferenciação APK vs Web
- [x] FAQ com pergunta de offline por modo de acesso
- [x] Subtexto do hero menciona "navegador ou Android"

## 10. Critérios de Aceite — Auth Web (RF-39, RF-40, RNF-11)

- [x] Google OAuth no web não exibe "Login cancelado" após iniciar o redirect
- [x] F5 em sessão ativa (Google ou e-mail) mantém usuário logado — vai direto para HomeScreen
- [x] `SplashRouter` exibe splash visual durante resolução de sessão (sem flash branco)
- [x] Fluxo sem sessão → `LandingScreen` (web) ou `LoginScreen` (mobile) — comportamento correto mantido
