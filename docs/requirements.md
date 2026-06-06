# Documento de Requisitos — Vectorium / Metricora Web App

**Versão:** 1.7  
**Data:** 2026-06-06  
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

## 3. Atores e Limites de Dispositivos

| Ator | Descrição | Dispositivos Permitidos |
|---|---|---|
| **Usuário Free** | Acesso básico: registro de transações e histórico. | **1 dispositivo** |
| **Usuário Pro** | Acesso completo: DRE, IA, filtros avançados, Metas, Contabilidade. | **2 dispositivos** |
| **Usuário Pro+** | Acesso completo sem restrição de dispositivos. | **Ilimitado** |

---

## 4. Requisitos Funcionais

### 4.1 Autenticação

| ID | Requisito | Prioridade |
|---|---|---|
| RF-01 | Permitir **login** com e-mail e senha via Supabase Auth | Alta |
| RF-02 | Permitir **cadastro** de novo usuário com nome, e-mail e senha | Alta |
| RF-03 | Tela de cadastro com **mesmo layout visual** da tela de login | Alta |
| RF-04 | Após cadastro bem-sucedido, redirecionar para o painel principal | Alta |
| RF-05 | Exibir mensagem de erro clara em caso de e-mail já cadastrado ou senha fraca | Média |
| RF-06 | Permitir **recuperação de senha** via e-mail | Média |
| RF-39 | No web, `null` retornado por `GoogleAuthHelper.entrar()` **não deve ser tratado como erro** — indica redirect OAuth em andamento | Alta |
| RF-40 | `SplashRouter` deve resolver a sessão ativa (Supabase Auth ou SharedPreferences) **antes de renderizar qualquer tela** | Alta |
| RF-41 | Ao fazer **logout**, todos os estados de notificação visíveis devem ser limpos antes de redirecionar para a tela inicial | Alta |

### 4.2 Controle de Dispositivos por Plano

| ID | Requisito | Prioridade |
|---|---|---|
| RF-42 | Limitar contas **FREE a 1 dispositivo** ativo simultaneamente. Tentativa de login em 2º dispositivo deve ser bloqueada com mensagem clara. | Alta |
| RF-43 | Limitar contas **PRO a 2 dispositivos** ativos simultaneamente. | Alta |
| RF-44 | `verificarLimite()` deve checar o limite total (`lista.length >= limite`) **antes** de aplicar qualquer lógica de substituição por plataforma — sem bypass possível. | Alta |
| RF-45 | Quando há vaga no limite e um dispositivo da mesma plataforma já existe, o dispositivo antigo deve ser removido e substituído (`replacedSamePlatform`). | Média |
| RF-46 | Exibir e gerenciar dispositivos ativos em tela dedicada `DispositivosScreen`, com opção de revogar qualquer sessão remotamente. | Alta |

### 4.3 Painel Principal (Dashboard)

| ID | Requisito | Prioridade |
|---|---|---|
| RF-07 | Exibir cards de resumo: receita total, lucro, CPV, margem | Alta |
| RF-08 | Permitir lançamento de venda/despesa via formulário | Alta |
| RF-09 | Listar registros recentes com paginação | Alta |
| RF-10 | Filtros por período: Hoje, Mês, Geral | Alta |

### 4.4 Contabilidade / DRE

| ID | Requisito | Prioridade |
|---|---|---|
| RF-11 | Exibir DRE mensal simplificado | Alta |
| RF-12 | Exportar DRE em PDF | Média |
| RF-13 | Gráfico de evolução 6 meses | Média |

### 4.5 Banco de Dados Local (Web WASM)

| ID | Requisito | Prioridade |
|---|---|---|
| RF-14 | Na versão Web, usar **Drift + sqlite3.wasm** como banco local no browser (IndexedDB via WASM) | Alta |
| RF-15 | Sincronizar dados locais com Supabase após login (push + pull com LWW) | Alta |
| RF-16 | O arquivo `sqlite3.wasm` deve ser servido em `/app/sqlite3.wasm` (path absoluto) | Alta |
| RF-17 | O arquivo `drift_worker.dart.js` deve ser servido em `/app/drift_worker.dart.js` | Alta |

### 4.6 PWA (Progressive Web App)

| ID | Requisito | Prioridade |
|---|---|---|
| RF-18 | O app deve ser instalável como PWA em desktop e mobile | Média |
| RF-19 | O manifest.json deve referenciar ícones PNG válidos 192×192 e 512×512 | Alta |
| RF-20 | Ícones definitivos com logo da marca devem substituir os placeholders | Média |

### 4.7 Segurança (CSP)

| ID | Requisito | Prioridade |
|---|---|---|
| RF-21 | O `index.html` deve ter `Content-Security-Policy` que permita `'wasm-unsafe-eval'` (Drift/WASM) | Alta |
| RF-22 | O CSP deve liberar `accounts.google.com` e `*.googleapis.com` para Google Sign-In | Alta |
| RF-23 | O CSP deve liberar `*.supabase.co` (HTTP + WSS) para conexões com o backend | Alta |

### 4.8 Landing Page — Navbar

| ID | Requisito | Prioridade |
|---|---|---|
| RF-24 | Navbar com links de navegação incluindo "Como Acessar" → `#acesso` | Alta |
| RF-25 | Dois botões: **"Versão Web"** (outline azul) e **"Baixar para Android"** (gradiente) | Alta |
| RF-26 | Botão de download especifica explicitamente **Android** | Média |
| RF-27 | Em mobile (≤ 700px): botão "Versão Web" oculto; apenas CTA de download | Média |

### 4.9 Landing Page — Arquitetura de Seções

| ID | Requisito | Prioridade |
|---|---|---|
| RF-28 | Bloco **"Escolha de acesso"** (`#acesso`) logo após o hero — dois cards: Android APK e Versão Web | Alta |
| RF-29 | Screenshots antes das funcionalidades completas | Média |
| RF-30 | Depoimentos antes do pricing | Média |
| RF-31 | Ordem: Hero → Acesso → Screenshots → Features → Segmentos → Depoimentos → Pricing → FAQ → CTA Final | Alta |
| RF-32 | Subtexto do hero: "no navegador ou no seu Android" | Média |
| RF-33 | Trust row distingue: "Offline no Android via APK" e "Web no navegador" | Alta |

### 4.10 Landing Page — Diferenciação APK vs Web

| ID | Requisito | Prioridade |
|---|---|---|
| RF-34 | Card Android APK: funciona **offline de verdade**, dados locais | Alta |
| RF-35 | Card Versão Web: sem instalação, requer internet, acesso em qualquer dispositivo | Alta |
| RF-36 | Feature card "offline" específico ao Android APK | Alta |
| RF-37 | FAQ com pergunta sobre diferença entre APK Android e Versão Web | Média |
| RF-38 | FAQ com pergunta sobre offline por modo de acesso | Média |

---

## 5. Requisitos Não Funcionais

| ID | Requisito | Categoria |
|---|---|---|
| RNF-01 | Interface responsiva (mínimo 320px) | Usabilidade |
| RNF-02 | Tema escuro consistente — sem hardcodes de cor, usar `AppConfigs.*` | Manutenibilidade |
| RNF-03 | TTI < 5s em conexão 4G | Performance |
| RNF-04 | Autenticação por HTTPS (Supabase + CNAME vectorium.tec.br) | Segurança |
| RNF-05 | Dados isolados por `user_id` em todas as queries (RLS ativo) | Segurança |
| RNF-06 | Build Flutter Web com tree-shaking e minificação | Performance |
| RNF-07 | Landing page sem dependências JS externas além de Tailwind CDN e Phosphor Icons | Manutenibilidade |
| RNF-08 | CI/CD automatizado: todo push em `main` dispara build + deploy via GitHub Actions | Infraestrutura |
| RNF-09 | `sqlite3.wasm` e `drift_worker.dart.js` presentes em `build/web/` no deploy | Infraestrutura |
| RNF-10 | Deploy idempotente: sem mudanças → nenhum commit gerado | Infraestrutura |
| RNF-11 | Sessão do usuário deve **persistir no reload (F5)** — `SplashRouter` resolve antes de renderizar UI | Usabilidade |
| RNF-12 | Logout garante **limpeza completa de estado de UI** — sem notificações ou badges remanescentes | Usabilidade |
| RNF-13 | **Inviolabilidade do limite de dispositivos:** o sistema nunca permite mais dispositivos ativos que o definido por plano (`kDeviceLimits`), mesmo em trocas de plataforma ou caminhos alternativos de login. | Segurança |

---

## 6. Modelo de Dados — Tabela `device_sessions` (Supabase)

| Campo | Tipo | Descrição |
|---|---|---|
| `user_id` | UUID | FK para `profiles.id` |
| `device_id` | TEXT | UUID gerado por `DeviceService.getDeviceId()` e persistido em `SharedPreferences` |
| `device_name` | TEXT | Nome amigável: Android, iOS, Windows, macOS, Linux, Web |
| `platform` | TEXT | Categoria: `mobile`, `desktop`, `web` — usada para lógica de substituição |
| `last_seen_at` | TIMESTAMPTZ | Última atividade registrada |

**Constraint:** `UNIQUE(user_id, device_id)`

**Limites por plano (definidos em `kDeviceLimits`):**
```dart
const Map<String, int> kDeviceLimits = {
  'FREE':  1,
  'PRO':   2,
  'PRO+':  999,
};
```

---

## 7. Correções & Melhorias

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
| FIX-15 | Arquitetura de seções da landing reorganizada | ✅ 05/06/2026 |
| FIX-16 | Promessa offline corrigida: APK vs Web diferenciados em toda landing | ✅ 05/06/2026 |
| FIX-17 | FAQ atualizado com perguntas de diferenciação APK vs Web | ✅ 05/06/2026 |
| FIX-18 | `null` do Google OAuth no web tratado erroneamente como cancelamento | ✅ 05/06/2026 |
| FIX-19 | F5 destruía sessão ativa — `SplashRouter` adicionado | ✅ 05/06/2026 |
| FIX-20 | Notificação persiste após logout — estado de UI não limpo no encerramento de sessão | 🔴 Pendente |
| FIX-21 | Bypass de limite FREE via substituição de plataforma antes da checagem total | ✅ 06/06/2026 |

---

## 8. Critérios de Aceite — Banco WASM (RF-14 a RF-17)

- [x] `vectorium.tec.br/app/sqlite3.wasm` responde 200
- [x] `vectorium.tec.br/app/drift_worker.dart.js` responde 200
- [x] Console do browser sem erros de 404 WASM
- [x] Banco local persiste dados entre sessões (IndexedDB via Drift WASM)
- [x] Login por e-mail funciona sem `LateInitializationError`

## 9. Critérios de Aceite — CSP (RF-21 a RF-23)

- [x] Google Sign-In carrega sem bloqueio de CSP
- [x] Supabase (HTTP + WebSocket) sem bloqueio de CSP
- [x] WASM executa sem bloqueio (`wasm-unsafe-eval`)
- [x] Fontes Google carregam normalmente

## 10. Critérios de Aceite — PWA (RF-18 a RF-20)

- [x] Ícone 192×192 válido — sem erro no Manifest
- [x] Ícone 512×512 válido
- [ ] Ícones definitivos com logo da marca (pendente)
- [ ] PWA instalável sem avisos no browser

## 11. Critérios de Aceite — Landing Arquitetura (RF-28 a RF-38)

- [x] Bloco "Escolha de acesso" exibido logo após o hero com cards Android e Web
- [x] Screenshots aparecem antes das funcionalidades
- [x] Depoimentos aparecem antes do pricing
- [x] Trust row distingue APK offline vs Web com internet
- [x] Feature card offline específico para APK Android
- [x] FAQ com pergunta de diferenciação APK vs Web
- [x] FAQ com pergunta de offline por modo de acesso
- [x] Subtexto do hero menciona "navegador ou Android"

## 12. Critérios de Aceite — Auth Web (RF-39, RF-40, RNF-11)

- [x] Google OAuth no web não exibe "Login cancelado" após iniciar o redirect
- [x] F5 em sessão ativa (Google ou e-mail) mantém usuário logado
- [x] `SplashRouter` exibe splash visual durante resolução de sessão
- [x] Fluxo sem sessão → `LandingScreen` (web) / `LoginScreen` (mobile)

## 13. Critérios de Aceite — Logout Limpo (RF-41, RNF-12)

- [ ] Após logout, nenhuma notificação ou badge permanece visível na UI
- [ ] Estado de notificação é resetado antes do redirecionamento
- [ ] Relogar com outra conta não exibe notificações do usuário anterior

## 14. Critérios de Aceite — Controle de Dispositivos (RF-42 a RF-46, RNF-13)

- [x] Usuário FREE bloqueado ao tentar entrar em 2º dispositivo — qualquer plataforma
- [x] Usuário PRO aceita até 2 dispositivos simultâneos
- [x] Substituição de plataforma só ocorre quando ainda há vaga no limite total
- [x] Mensagem de erro clara ao atingir limite, com instrução para revogar na `DispositivosScreen`
- [ ] `DispositivosScreen` lista todos os dispositivos ativos com opção de revogação remota
- [ ] Revogação remota via Realtime (canal `device_revogacao_<deviceId>`) funciona em todos os planos
