# Engineering Log — Vectorium / Metricora

Registro cronológico de decisões técnicas, correções e melhorias.

---

## 2026-06-06 — Sprint Controle de Dispositivos por Plano

### [DEV1] Fix: verificarLimite — limite total checado antes da substituição de plataforma

**Commit:** `fix(devices): verificar limite total antes de substituir plataforma para respeitar plano FREE` (repo: metricora)  
**Arquivo:** `lib/helpers/device_service.dart`  
**Refs:** RF-42, RF-43, RNF-13

**Problema:** A lógica de `verificarLimite()` checava substituição de plataforma *antes* de checar o limite total de dispositivos. Isso criava um bypass silencioso: um usuário FREE com 1 dispositivo mobile que tentasse entrar num segundo mobile substituía o primeiro sem bloquear — violando o limite de 1 dispositivo do plano FREE.

**Fluxo bugado:**
```
FREE com 1 dispositivo mobile → entra com 2º mobile
  → verifica mesma plataforma? SIM
  → deleta o 1º → substitui → status: replacedSamePlatform
  → NUNCA chega na checagem lista.length >= limite  ← BYPASS
```

**Causa raiz:** Ordem incorreta das verificações em `verificarLimite()`. A substituição por plataforma foi concebida para planos com múltiplos slots (PRO+), mas a posição no código permitia que bypass ocorresse em qualquer plano.

**Correção — nova ordem:**
```dart
// 1. Já registrado → ok (entra sem burocracia)
final jaRegistrado = lista.any((r) => r['device_id'] == deviceId);
if (jaRegistrado) return const DeviceCheckResult(status: DeviceCheckStatus.ok);

// 2. Limite total atingido → BLOQUEIA (antes de qualquer substituição)
if (lista.length >= limite) {
  return DeviceCheckResult(
    status: DeviceCheckStatus.limitReached,
    errorMessage: 'Limite de $nomeLimit atingido ...',
  );
}

// 3. Há vaga, mas mesma plataforma → substitui
if (mesmaPlatforma.isNotEmpty) {
  // deleta antigo, retorna replacedSamePlatform
}

// 4. Dentro do limite, plataforma nova → ok
```

**Limites por plano (`kDeviceLimits`):**
```dart
const Map<String, int> kDeviceLimits = {
  'FREE':  1,
  'PRO':   2,
  'PRO+':  999,
};
```

**Comportamento pós-fix:**

| Cenário | FREE (1) | PRO (2) |
|---|---|---|
| Mesmo dispositivo | ✅ entra | ✅ entra |
| 2º device, plataforma diferente | 🚫 bloqueado | ✅ entra |
| 2º device, mesma plataforma | 🚫 bloqueado | ✅ substitui antigo |
| 3º device qualquer | 🚫 bloqueado | 🚫 bloqueado |

**Resultado:** Plano FREE garantido a 1 dispositivo independentemente de plataforma. Substituição de plataforma preservada para PRO quando ainda há vaga.

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
  _setErro('Login com Google cancelado ou falhou.');
}

// DEPOIS — correto
if (user != null) {
  _entrarNoApp(user);
} else if (kIsWeb) {
  return;  // redirect em andamento, aguarda SplashRouter
} else {
  _setErro('Login com Google cancelado ou falhou.');
}
```

**Resultado:** Mensagem de erro eliminada. Fluxo web exibe spinner → Google abre seleção → usuário loga → `SplashRouter` captura a sessão.

---

### [AUTH2] Fix: SplashRouter — sessão some no F5 (reload)

**Commit:** `fix(web): adiciona SplashRouter — resolve sessão antes de renderizar, elimina flash no F5` (repo: metricora)  
**Arquivos:** `lib/screens/splash_router.dart` (novo), `lib/main.dart`  
**Refs:** FIX-19, RF-39, RF-40

**Problema:** No web, F5 sempre exibia a `LandingScreen` antes de resolver a sessão ativa.

**Solução — SplashRouter:**
```
F5 → SplashRouter.initState() → _resolver()
  ├─ Supabase.currentUser != null → HomeScreen ✅
  ├─ SharedPreferences['saved_user'] → HomeScreen ✅
  └─ Nenhum → LandingScreen / LoginScreen
```

**Resultado:** F5 mantém sessão para Google OAuth + e-mail/senha. Sem flash de LandingScreen.

---

## 2026-06-05 — Sprint Landing / Arquitetura

### [LAND1] Refactor: Reorganização de arquitetura da landing page

**Commit:** `775b7d3` (squash merge PR #1, branch `refactor/landing-arquitetura`)  
**Arquivo:** `index.html`  
**Refs:** RF-28 a RF-38, RNF-01, RNF-02, RNF-07

**Problemas identificados:**
1. Sem bloco de escolha entre APK vs Web
2. "100% Offline" genérico e enganoso para Versão Web
3. Screenshots tarde demais — prova de produto postergada
4. Depoimentos após pricing — prova social fora do lugar
5. FAQ sem diferenciação de modos de acesso

**Nova ordem de seções:**

| Posição | Antes | Depois |
|---|---|---|
| 1 | Hero | Hero |
| 2 | Features | **Escolha de acesso** (RF-28) |
| 3 | Segmentos | **Screenshots** (RF-29) |
| 4 | Screenshots | Features |
| 5 | Pricing | Segmentos |
| 6 | Depoimentos | **Depoimentos** (RF-30) |
| 7 | FAQ | Pricing |
| 8 | CTA Final | FAQ |
| 9 | — | CTA Final |

**Resultado:** Arquitetura alinhada com a realidade do produto. Elimina expectativa errada de offline para Versão Web.

---

## 2026-06-04 — Sprint Web (PWA / Deploy)

### [WEB1] Fix: sqlite3Uri e driftWorkerUri com path absoluto

**Commit:** `86370e0` (repo: metricora)  
**Arquivo:** `lib/helpers/db_connection_web.dart`

**Problema:** URIs relativas no contexto de Web Worker ignoravam `base-href`. Resultado: 404 em `sqlite3.wasm`.

**Correção:** `Uri.parse('/app/sqlite3.wasm')` e `Uri.parse('/app/drift_worker.dart.js')`.

---

### [WEB2] Fix: CSP bloqueando Google Sign-In

**Commit:** `d64b308` (repo: metricora)  
**Arquivo:** `web/index.html`

**Correção:** CSP expandida com `accounts.google.com` e `*.googleapis.com`.

---

### [WEB3] Fix: Ícones PWA corrompidos

**Commit:** `ede76d8` (repo: metricora)  
**Arquivos:** `web/icons/*.png`

**Correção:** PNGs válidos 192×192 e 512×512 gerados via Python + struct + zlib.

---

### [WEB4] Fix: sqlite3.wasm e drift_worker.dart.js ausentes no deploy

**Commits:** `bfc779b` → `202ae58` → `cc14c9e` (repo: metricora)  
**Arquivo:** `.github/workflows/deploy_web.yml`

**Solução:** Compilação do `drift_worker.dart.js` no workflow + cópia de `sqlite3.wasm` do pub-cache.

---

### [WEB5] CI/CD: GitHub Actions automatizado

**Arquivo:** `.github/workflows/deploy_web.yml` — ✅ Ativo

---

## 2026-06-04 — Sprint UI / Navbar

### [FIX] Revert redesign completo do index.html

**Commits:** `180d8b2` — Restauração para blob SHA `935543e`.

---

### [FEAT] Navbar landing — "Versão Web" como botão + especificação Android

**Commit:** `104439a` — Dois botões na navbar: outline azul (Web) + gradiente (Android).

---

### [FIX] Remoção de hardcodes dark em 4 telas — Metricora Flutter

**Commit:** `dd04d79` (repo: metricora) — Substituição por `AppConfigs.*` em 4 telas.

---

## Bugs Corrigidos — Inventário

| ID | Data | Repo | Arquivo | Descrição | Status |
|---|---|---|---|---|---|
| BW1 | 04/06 | metricora | `db_connection_web.dart` | `sqlite3.wasm` 404 — URI relativa no contexto de Web Worker ignora `base-href` | ✅ |
| BW2 | 04/06 | metricora | `web/index.html` | CSP bloqueava `accounts.google.com` → Google Sign-In inoperante | ✅ |
| BW3 | 04/06 | metricora | `web/icons/*.png` | Ícones PWA eram stubs de 80/44 bytes — browser rejeitava | ✅ |
| BW4 | 04/06 | metricora | `deploy_web.yml` | `sqlite3.wasm` e `drift_worker.dart.js` ausentes no deploy | ✅ |
| BW5 | 04/06 | metricora | `main.dart` + Drift | `LateInitializationError` em cascata — banco local falhava silenciosamente | ✅ |
| BW6 | 05/06 | metricora | `login_screen.dart` | `null` no web tratado como cancelamento → falsa mensagem de erro no Google OAuth | ✅ |
| BW7 | 05/06 | metricora | `main.dart` + `splash_router.dart` | F5 destruía sessão ativa | ✅ |
| BW8 | 06/06 | metricora | `device_service.dart` | Bypass de limite FREE por substituição de plataforma antes da checagem total | ✅ |
| UI1 | 04/06 | metricora | 4 telas | Cores hardcoded violando `AppConfigs.*` | ✅ |
| LP1 | 05/06 | vectorium-landing | `index.html` | Arquitetura de seções subótima — sem diferenciação APK vs Web | ✅ |
| LP2 | 05/06 | vectorium-landing | `index.html` | Afirmação "100% Offline" genérica e incorreta para Versão Web | ✅ |
| BW9 | — | metricora | a identificar | Notificação persiste após logout — estado de UI não limpo | 🔴 Pendente |

---

## Backlog / Próximas Ações

| Prioridade | Item |
|---|---|
| 🔴 Alta | **BW9: Notificação persiste após logout** — limpar estado de notificação no logout |
| 🔴 Alta | FIX: RegisterScreen visual inconsistente com LoginScreen |
| 🔴 Alta | Ícones PWA definitivos (substituir placeholder `#0177C2` pelo logo real) |
| 🟡 Média | Tela de recuperação de senha (ForgotPasswordScreen) |
| 🟡 Média | Script SQL de migration Supabase (campos V12+ ausentes no schema remoto) |
| 🟡 Média | Análise de conversão da landing após reorganização de arquitetura |
| 🟢 Baixa | Light mode / alternância de tema |
| 🟢 Baixa | Testes automatizados (widget tests + integration tests) |
