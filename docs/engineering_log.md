# Engineering Log — Vectorium / Metricora

Registro cronológico de decisões técnicas, correções e melhorias.

---

## 2026-06-05 — Sprint Auth Web

### [AUTH1] Fix: initialSession não disparava após redirect OAuth Google

**Commit:** `fix(auth): suprime erro falso 'Google cancelado' no web (redirect flow)` (repo: metricora)  
**Arquivo:** `lib/screens/login_screen.dart`  
**Refs:** FIX-18

**Problema:** No web, `GoogleAuthHelper.entrar()` chama `signInWithOAuth()` e retorna `null` imediatamente — comportamento correto, pois o redirect ainda está em andamento. O método `_loginGoogle()` tratava esse `null` como falha e exibia a mensagem `"Login com Google cancelado ou falhou."` antes mesmo de o usuário ver a tela de seleção de conta Google.

**Fluxo bugado:**
```
Clica "Entrar com Google"
  → signInWithOAuth() dispara redirect → retorna null
  → _loginGoogle() recebe null
  → exibe "Login com Google cancelado" ← ERRADO
  → Google abre seleção de conta (assíncrono)
```

**Causa raiz:** `null` no web não significa cancelamento — significa redirect em andamento. O guard condicional não diferenciava plataforma.

**Correção:**
```dart
// ANTES — errado para web
if (user != null) {
  _entrarNoApp(user);
} else {
  _setErro('Login com Google cancelado ou falhou.'); // sempre disparava no web
}

// DEPOIS — correto
if (user != null) {
  _entrarNoApp(user);       // Android: entrou, vai para o app
} else if (kIsWeb) {
  return;                   // Web: null é esperado, redirect em andamento
} else {
  _setErro('Login com Google cancelado ou falhou.'); // Android: cancelamento real
}
```

**Resultado:** Mensagem de erro eliminada. Fluxo web agora exibe o spinner → Google abre seleção de conta → usuário loga → `SplashRouter` captura a sessão.

---

### [AUTH2] Fix: SplashRouter — sessão some no F5 (reload)

**Commit:** `fix(web): adiciona SplashRouter — resolve sessão antes de renderizar, elimina flash no F5` (repo: metricora)  
**Arquivos:** `lib/screens/splash_router.dart` (novo), `lib/main.dart`  
**Refs:** FIX-19, RF-39, RF-40

**Problema:** No web, pressionar F5 recarregava o app e sempre exibia a `LandingScreen` por um instante antes de tentar resolver a sessão — independente de o usuário estar logado. Para sessões de e-mail/senha Supabase ou via Google OAuth, o app voltava para a tela inicial em vez de retomar a sessão ativa.

**Causa raiz:** `main.dart` usava `home: kIsWeb ? const LandingScreen() : const LoginScreen()`. O `onAuthStateChange` com `initialSession` só cobria o fluxo OAuth; login por e-mail não tinha recuperação de sessão no reload.

**Solução — SplashRouter:**

Nova tela `SplashRouter` que resolve o estado de autenticação **antes de renderizar qualquer UI**, cobrindo 3 cenários:

```
F5 → SplashRouter.initState() → _resolver()
        │
        ├─ Supabase.currentUser != null?
        │     └─ resolverSessaoAtual() → user → HomeScreen ✅
        │        (cobre Google OAuth + email/senha Supabase)
        │
        ├─ SharedPreferences['saved_user'] existe? (mobile PRO)
        │     └─ getUserByName() → user → HomeScreen ✅
        │
        └─ Nenhum → LandingScreen (web) / LoginScreen (mobile)
```

**Splash visual:** fundo escuro `#0A0F1E` com logo + spinner azul — sem flash branco.

**Alteração em main.dart:**
```dart
// ANTES
home: kIsWeb ? const LandingScreen() : const LoginScreen(),

// DEPOIS
home: const SplashRouter(),
```

**Resultado:** F5 mantém sessão para todos os tipos de login (Google OAuth + e-mail/senha). Sem flash de LandingScreen. Resolve em ~100–200ms na maioria dos casos.

---

## 2026-06-05 — Sprint Landing / Arquitetura

### [LAND1] Refactor: Reorganização de arquitetura da landing page

**Commit:** `775b7d3` (squash merge PR #1, branch `refactor/landing-arquitetura`)  
**Arquivo:** `index.html`  
**Refs:** RF-28 a RF-38, RNF-01, RNF-02, RNF-07

**Contexto:** A landing page estava com uma arquitetura de seções subótima para conversão. O principal problema era a ausência de diferenciação clara entre os dois modos de acesso ao produto (APK Android vs Versão Web), gerando expectativas erradas sobre o comportamento offline — que é exclusivo do APK, não da Versão Web.

**Problemas identificados:**
1. Nenhum bloco destacava a escolha entre APK Android e Versão Web — o usuário chegava sem clareza sobre como acessar
2. A afirmação "100% Offline" era genérica e enganosa para quem acessasse pela Versão Web no navegador
3. Screenshots apareciam tarde demais (após features e segmentos) — prova de produto postergada
4. Depoimentos apareciam depois do pricing — prova social não reforçava a decisão de compra/acesso
5. FAQ não tinha pergunta sobre diferença entre os modos de acesso

**Solução — nova ordem de seções:**

| Posição | Antes | Depois |
|---|---|---|
| 1 | Hero | Hero |
| 2 | Features | **Escolha de acesso (novo — RF-28)** |
| 3 | Segmentos | **Screenshots (antecipado — RF-29)** |
| 4 | Screenshots | Features |
| 5 | Pricing | Segmentos |
| 6 | Depoimentos | **Depoimentos (movido — RF-30)** |
| 7 | FAQ | Pricing |
| 8 | CTA Final | FAQ |
| 9 | — | CTA Final |

**Mudanças implementadas:**

- Novo bloco `#acesso` com dois cards diferenciados:
  - **Android APK**: offline de verdade, dados locais, badge "Recomendado para uso offline"
  - **Versão Web**: sem instalação, requer internet, badge "Acesso rápido sem instalação"
- Subtexto do hero corrigido: "no navegador ou no seu Android"
- Trust row corrigida: "Offline no Android via APK" + "Web no navegador" (sem afirmação genérica)
- Feature card offline renomeado: "Offline no Android" com tag "APK Android"
- Screenshots antecipadas antes de features
- Depoimentos movidos para antes do pricing
- Novo link "Como Acessar" na navbar apontando para `#acesso`
- FAQ com 2 novas perguntas:
  - "O app funciona sem internet?" → resposta diferenciada por modo
  - "Qual é a diferença entre a Versão Web e o APK Android?" → explica trade-offs
- Pricing: lista atualizada com "Offline no Android via APK" e "Versão Web no navegador" como itens separados

**Visual:** 100% mantido — paleta, fontes, animações, grid e identidade intactos.

**Resultado:** Arquitetura de conteúdo alinhada com a realidade do produto. Elimina expectativa errada de offline para Versão Web.

---

## 2026-06-04 — Sprint Web (PWA / Deploy)

### [WEB1] Fix: sqlite3Uri e driftWorkerUri com path absoluto

**Commit:** `86370e0` (repo: metricora)  
**Arquivo:** `lib/helpers/db_connection_web.dart`

**Problema:** O `WasmDatabase.open()` usava URIs relativas (`sqlite3.wasm`, `drift_worker.dart.js`). O Flutter serve o app em `/app/` via `--base-href /app/`, mas o `drift_worker` é instanciado como **Web Worker** separado — cujo contexto de URL parte da raiz do domínio, ignorando o `base-href` do `index.html`. Resultado: o worker procurava `sqlite3.wasm` em `vectorium.tec.br/sqlite3.wasm` (inexistente) → 404.

Erros no console:
```
app/sqlite3.wasm:1 Failed to load resource: 404
⚠️ Erro ao iniciar banco local: TypeError: Failed to execute 'compile' on 'WebAssembly': HTTP status code is not ok
app/:1 Failed to fetch a worker script.
```

**Correção:**
```dart
// ANTES
sqlite3Uri: Uri.parse('sqlite3.wasm'),
driftWorkerUri: Uri.parse('drift_worker.dart.js'),

// DEPOIS
sqlite3Uri: Uri.parse('/app/sqlite3.wasm'),
driftWorkerUri: Uri.parse('/app/drift_worker.dart.js'),
```

**Efeito cascata resolvido:** A falha no banco fazia `DatabaseHelper._driftConnection` ficar `null`. Toda query subsequente lançava `LateInitializationError: Field '' has not been initialized`, que se propagava para o `loginComEmail` do Supabase — fazendo parecer que o Supabase não estava inicializado (mas estava). Corrigir o path resolveu o login.

---

### [WEB2] Fix: CSP bloqueando Google Sign-In

**Commit:** `d64b308` (repo: metricora)  
**Arquivo:** `web/index.html`

**Problema:** A `Content-Security-Policy` restringia `script-src` a `'self'`, `'unsafe-eval'`, `'unsafe-inline'`, `'wasm-unsafe-eval'` e `https://www.gstatic.com`. O script do Google Sign-In (`https://accounts.google.com/gsi/client`) era bloqueado, impedindo autenticação social.

**Correção:** CSP expandida:
```html
script-src  ... https://accounts.google.com https://*.googleapis.com;
style-src   ... https://accounts.google.com;
connect-src ... https://accounts.google.com https://*.googleapis.com;
frame-src   https://accounts.google.com;
child-src   blob: https://accounts.google.com;
img-src     ... https://*.googleusercontent.com;
```

**Decisão:** Usar `https://*.googleapis.com` (wildcard de subdomínio) para cobrir futuras APIs Google sem nova alteração de CSP.

---

### [WEB3] Fix: Ícones PWA corrompidos

**Commit:** `ede76d8` (repo: metricora)  
**Arquivos:** `web/icons/Icon-192.png`, `Icon-512.png`, `Icon-maskable-192.png`, `Icon-maskable-512.png`

**Problema:** Os 4 arquivos PNG eram placeholders inválidos gerados pelo `flutter create` (80 bytes e 44 bytes). O browser os rejeitava ao instalar o PWA.

**Correção:** PNGs válidos gerados programaticamente (Python + struct + zlib) — 192×192 e 512×512 com cor sólida `#0177C2`. Todos os 4 arquivos substituídos com header PNG correto (`\x89PNG`).

**Nota:** ícones são placeholders funcionais. Substituir pelo logo definitivo da marca quando disponível.

---

### [WEB4] Fix: sqlite3.wasm e drift_worker.dart.js ausentes no deploy

**Commits:** `bfc779b` → `202ae58` → `cc14c9e` (repo: metricora)  
**Arquivo:** `.github/workflows/deploy_web.yml`

**Problema:** O `flutter build web` **não inclui** automaticamente `sqlite3.wasm` nem `drift_worker.dart.js` em `build/web/`. O workflow anterior copiava apenas `build/web/` para o deploy — os dois arquivos WASM/worker chegavam ausentes em produção, causando o erro 404 persistente mesmo após WEB1.

**Solução final** (`cc14c9e`):
```yaml
- name: Compile drift_worker.dart.js inside project context
  run: |
    DRIFT_WORKER_SRC=$(find ~/.pub-cache -path '*/drift-*/web/drift_worker.dart' | head -1)
    cp "$DRIFT_WORKER_SRC" web/drift_worker.dart
    dart compile js -O2 -o web/drift_worker.dart.js web/drift_worker.dart
    rm web/drift_worker.dart

- name: Copy sqlite3.wasm to build/web
  run: |
    SQLITE3_WASM=$(find ~/.pub-cache -name 'sqlite3.wasm' | head -1)
    cp "$SQLITE3_WASM" build/web/sqlite3.wasm

- name: Copy drift_worker.dart.js to build/web
  run: cp web/drift_worker.dart.js build/web/drift_worker.dart.js
```

**Status:** ✅ Funcionando em produção.

---

### [WEB5] CI/CD: GitHub Actions automatizado

**Arquivo:** `.github/workflows/deploy_web.yml`  
**Status:** ✅ Ativo

**Fluxo atual:**
1. Push em `main` (exceto `.md` e `.github/workflows/**`) → dispara workflow
2. `flutter pub get` + `flutter build web --release --base-href /app/`
3. Compila `drift_worker.dart.js` dentro do projeto
4. Copia `sqlite3.wasm` do pub cache para `build/web/`
5. Copia `build/web/` para `vectorium-landing/app/`
6. Commit automático + push → GitHub Pages atualiza em ~1 min

---

## 2026-06-04 — Sprint UI / Navbar

### [FIX] Revert redesign completo do index.html

**Commits:** `180d8b2`  
**Arquivo:** `index.html`

**Ação:** Restauração completa do arquivo para o blob SHA `935543e` (versão anterior ao redesign).

---

### [FEAT] Navbar landing — "Versão Web" como botão + especificação Android

**Commit:** `104439a`  
**Arquivo:** `index.html`

**Solução:** `<div class="navbar-actions">` com dois botões: `.navbar-web` (outline azul) e `.navbar-cta` (gradiente). Mobile: `.navbar-web { display: none }`.

---

### [FIX] Remoção de hardcodes dark em 4 telas — Metricora Flutter

**Commit:** `dd04d79` (repo: metricora)  
**Arquivos:** `historico_tab.dart`, `backup_screen.dart`, `contabilidade_screen.dart`, `atacadistas_screen.dart`

**Solução:** Substituição sistemática por `AppConfigs.*`. **Resultado:** 0 hardcodes remanescentes.

---

## 2026-05-XX (histórico estimado)

### [INFRA] Deploy Flutter Web via GitHub Pages

**Decisão:** GitHub Pages com CNAME `vectorium.tec.br`, app servido em `/app`.

---

### [INFRA] Supabase como backend

**Decisão:** Supabase (PostgreSQL + Auth) como backend único para autenticação e persistência.

---

### [ARCH] Centralização de design tokens em `styles.dart`

**Decisão:** `lib/styles.dart` com classe `AppConfigs` contendo todas as constantes de cor.

---

## Bugs Corrigidos — Inventário

| ID | Data | Repo | Arquivo | Descrição | Status |
|---|---|---|---|---|---|
| BW1 | 04/06 | metricora | `db_connection_web.dart` | `sqlite3.wasm` 404 — URI relativa no contexto de Web Worker ignora `base-href` | ✅ |
| BW2 | 04/06 | metricora | `web/index.html` | CSP bloqueava `accounts.google.com` → Google Sign-In inoperante | ✅ |
| BW3 | 04/06 | metricora | `web/icons/*.png` | Ícones PWA eram stubs de 80/44 bytes — browser rejeitava | ✅ |
| BW4 | 04/06 | metricora | `deploy_web.yml` | `sqlite3.wasm` e `drift_worker.dart.js` ausentes no deploy | ✅ |
| BW5 | 04/06 | metricora | `main.dart` + Drift | `LateInitializationError` em cascata — banco local falhava silenciosamente | ✅ (via BW1+BW4) |
| BW6 | 05/06 | metricora | `login_screen.dart` | `null` no web tratado como cancelamento → falsa mensagem de erro no Google OAuth | ✅ |
| BW7 | 05/06 | metricora | `main.dart` + `splash_router.dart` | F5 destruía sessão ativa — LandingScreen sempre renderizada antes da resolução de sessão | ✅ |
| UI1 | 04/06 | metricora | 4 telas | Cores hardcoded violando `AppConfigs.*` | ✅ |
| LP1 | 05/06 | vectorium-landing | `index.html` | Arquitetura de seções subótima — sem diferenciação APK vs Web | ✅ |
| LP2 | 05/06 | vectorium-landing | `index.html` | Afirmação "100% Offline" genérica e incorreta para Versão Web | ✅ |
| BW8 | — | metricora | a identificar | Notificação persiste após logout — estado de UI não limpo no encerramento de sessão | 🔴 Pendente |

---

## Backlog / Próximas Ações

| Prioridade | Item |
|---|---|
| 🔴 Alta | **BW8: Notificação persiste após logout** — limpar estado de notificação no logout |
| 🔴 Alta | FIX: RegisterScreen visual inconsistente com LoginScreen |
| 🔴 Alta | Ícones PWA definitivos (substituir placeholder `#0177C2` pelo logo real) |
| 🟡 Média | Tela de recuperação de senha (ForgotPasswordScreen) |
| 🟡 Média | Script SQL de migration Supabase (campos V12+ ausentes no schema remoto) |
| 🟡 Média | Análise de conversão da landing após reorganização de arquitetura |
| 🟢 Baixa | Light mode / alternância de tema |
| 🟢 Baixa | Testes automatizados (widget tests + integration tests) |
