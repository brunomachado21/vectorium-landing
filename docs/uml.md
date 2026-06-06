# UML — Vectorium / Metricora

**Versão:** 1.4  
**Data:** 2026-06-05

---

## 1. Diagrama de Arquitetura de Deploy

```
┌───────────────────────────────────────────────┐
│       brunomachado21/metricora (Flutter)       │
│  push em main → GitHub Actions [deploy_web.yml]│
│                                                │
│  1. flutter pub get                            │
│  2. cp drift_worker.dart → web/ (do pub cache) │
│  3. dart compile js → web/drift_worker.dart.js │
│  4. flutter build web --release --base-href /app/│
│  5. cp sqlite3.wasm (pub cache) → build/web/   │
│  6. cp drift_worker.dart.js    → build/web/    │
└───────────────────────────────────────────────┘
                        │
                        │ cp -r build/web → app/
                        ▼
┌───────────────────────────────────────────────┐
│    brunomachado21/vectorium-landing            │
│    branch: main                                │
│                                                │
│    index.html          ← landing page estática │
│    docs/               ← documentação técnica  │
│    app/                ← Flutter Web build     │
│    ├── index.html       (com CSP + manifest)   │
│    ├── main.dart.js     (app compilado)        │
│    ├── sqlite3.wasm     (← copiado pub cache)  │
│    ├── drift_worker.dart.js (← compilado CI)   │
│    ├── flutter_bootstrap.js                    │
│    └── icons/           (PNGs válidos 192+512) │
└───────────────────────────────────────────────┘
                        │
                        │ GitHub Pages serve
                        ▼
              vectorium.tec.br
              ├── /           (landing page)
              └── /app/        (Flutter Web App)
                   ├── /app/sqlite3.wasm
                   └── /app/drift_worker.dart.js
```

---

## 2. Diagrama de Arquitetura — Landing Page

```
vectorium.tec.br  (GitHub Pages — index.html)
│
├── Navbar
│   ├── Links: Como Acessar | Funcionalidades | Segmentos | Preço | FAQ
│   ├── [Versão Web] → vectorium.tec.br/app   (outline azul)
│   └── [Baixar para Android] → /releases/.../metricora_app_releasev1.0.10.apk
│
├── #hero
│   ├── Headline + subtítulo ("no navegador ou no seu Android")
│   ├── Price section (R$0)
│   ├── CTA: [Baixar Grátis para Android] + [Versão Web]
│   └── Trust row: Android 6.0+ | Offline no Android via APK | Web no navegador
│
├── #acesso  ← NOVO (RF-28)
│   ├── Card Android APK
│   │   ├── Offline de verdade (dados locais no dispositivo)
│   │   └── Badge: "Recomendado para uso offline"
│   └── Card Versão Web
│       ├── Sem instalação, requer internet para carga inicial
│       └── Badge: "Acesso rápido sem instalação"
│
├── #screenshots  ← antecipado (RF-29)
│   └── print_dashboard | print_dre | print_loja | print_confeitaria
│
├── #features
│   └── 6 cards: Lucro Real | DRE | Insumos | Offline Android | PDF | Segurança
│
├── #modos
│   └── Salão | Confeitaria | Loja
│
├── #depoimentos  ← movido antes do pricing (RF-30)
│   └── 3 depoimentos reais
│
├── #pricing
│   └── R$0 · APK Android + Versão Web como itens separados na lista
│
├── #faq
│   ├── É gratuito?
│   ├── Funciona sem internet? (resposta diferenciada APK vs Web)
│   ├── Diferença APK vs Web? ← NOVA (RF-37)
│   ├── Dados seguros?
│   ├── iOS?
│   └── Como instalar APK?
│
└── CTA Final → [Baixar para Android] + [Versão Web]
```

---

## 3. Diagrama de Classes — Core (Metricora)

```
┌─────────────────────┐   ┌────────────────────────┐
│    DatabaseHelper   │   │      SyncService        │
│    (Singleton)      │   │                         │
│  +instance: static  │   │ +syncPendentes()        │
│  +init()            │   │ +pullFromSupabase()     │
│  +openDefaultConn() │◄──│ +listenRealtime(uid)    │
│  [Web: WasmDatabase]│   │ +stopRealtime()         │
│  [Mobile: sqflite]  │   └────────────────────────┘
└─────────────────────┘
         │ usa
         ▼
┌─────────────────────┐   ┌────────────────────────┐
│    SupabaseService  │   │  BackgroundSyncService  │
│                     │   │                         │
│ +loginComEmail()    │   │ +iniciar(userId)        │
│ +registrarEmailAuth()   │ +parar()                │
│ +logout()           │   │ Timer: 15min            │
│ +sincronizarPerfil()│   │ AppLifecycleObserver    │
└─────────────────────┘   └────────────────────────┘

┌─────────────────────┐   ┌────────────────────────┐
│    DeviceService    │   │     Session             │
│                     │   │                         │
│ +registrarDispositivo() │ +currentUser: UserModel?│
│ +verificarLimite()  │   │ (static, global)        │
│ +revogarAtual()     │   └────────────────────────┘
│ FREE≤1, PRO≤2       │
└─────────────────────┘

┌─────────────────────────────────────────────────────┐
│    GoogleAuthHelper                                  │
│                                                      │
│ +entrar(context) : Future<UserModel?>                │
│   ├─ kIsWeb  → _entrarWeb()  → signInWithOAuth()     │
│   │           retorna null (redirect em andamento)   │
│   └─ Android → _entrarAndroid() → signInWithIdToken()│
│                retorna UserModel se sucesso          │
│ +resolverSessaoAtual() : Future<UserModel?>          │
│   └─ usa Supabase.currentUser → _resolverUsuario()   │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│    SplashRouter  ← NOVO (05/06/2026)                │
│                                                      │
│ initState() → _resolver()                            │
│   ├─ Supabase.currentUser != null?                   │
│   │   └─ GoogleAuthHelper.resolverSessaoAtual()      │
│   │       → user != null → _irParaApp(user)          │
│   ├─ SharedPreferences['saved_user'] existe?         │
│   │   └─ DatabaseHelper.getUserByName()              │
│   │       → user != null → _irParaApp(user)          │
│   └─ Nenhum → LandingScreen (web) / LoginScreen (mobile)
│                                                      │
│ _irParaApp(user)                                     │
│   ├─ niche == 'none' → SetupNichoScreen              │
│   └─ niche preenchido → HomeScreen                   │
│                                                      │
│ build() → Scaffold fundo #0A0F1E + logo + spinner    │
└─────────────────────────────────────────────────────┘
```

---

## 4. Diagrama de Sequência — Login Web (com WASM)

```
Browser          main.dart      DatabaseHelper    WasmDatabase      SupabaseService
   |                 |                |                 |                  |
   | abre /app/      |                |                 |                  |
   |---------------->|                |                 |                  |
   |                 | SplashRouter   |                 |                  |
   |                 | _resolver()    |                 |                  |
   |                 |  Supabase.currentUser == null?   |                  |
   |                 |  SharedPreferences['saved_user'] == null?           |
   |                 |  → LandingScreen / LoginScreen   |                  |
   |                 |                |                 |                  |
   |                 | init()         |                 |                  |
   |                 |--------------->|                 |                  |
   |                 |                | WasmDatabase    |                  |
   |                 |                | .open()         |                  |
   |                 |                |---------------->|                  |
   |                 |                |  GET /app/sqlite3.wasm (200 ✅)    |
   |                 |                |  GET /app/drift_worker.dart.js (200✅)|
   |                 |                |<----------------|                  |
   |                 |<---------------|                 |                  |
   |                 | Supabase.initialize()            |                  |
   |                 |-------------------------------------------------------->|
   |                 |                                  |                  |
   | digita login    |                                  |                  |
   |---------------->|                                  |                  |
   |                 | loginComEmail()                  |                  |
   |                 |-------------------------------------------------------->|
   |                 |  signInWithPassword() → Supabase Auth               |
   |                 |  ✔ setUserEmail() → DatabaseHelper.instance          |
   |                 |  ✔ SyncService.syncPendentes()                       |
   |                 |  ✔ SyncService.pullFromSupabase()                    |
   |                 |<--------------------------------------------------------|
   | tela inicial    |                                  |                  |
   |<----------------|                                  |                  |
```

---

## 5. Diagrama de Sequência — Google OAuth Web (redirect flow)

```
Browser           LoginScreen        GoogleAuthHelper      Supabase Auth       SplashRouter
   |                   |                    |                    |                   |
   | clica Google      |                    |                    |                   |
   |------------------>|                    |                    |                   |
   |                   | _loginGoogle()     |                    |                   |
   |                   | setState(loading)  |                    |                   |
   |                   |------------------->|                    |                   |
   |                   |                    | signInWithOAuth()  |                   |
   |                   |                    |------------------->|                   |
   |                   |                    |    retorna null ✅ |                   |
   |                   |                    |    (redirect em andamento)             |
   |                   |<-------------------|                    |                   |
   |                   | kIsWeb → return    |                    |                   |
   |                   | (sem exibir erro)  |                    |                   |
   |                   |                    |                    |                   |
   | browser redireciona para accounts.google.com               |                   |
   | usuário seleciona conta                |                    |                   |
   | Supabase redireciona de volta para /app/                    |                   |
   |                                        |                    |                   |
   | Flutter inicializa app                 |                    |                   |
   |---------------------------------------------------------> SplashRouter          |
   |                                        |    _resolver()                         |
   |                                        |    Supabase.currentUser != null        |
   |                                        |    → resolverSessaoAtual()             |
   |                                        |    → _irParaApp(user) → HomeScreen ✅  |
```

---

## 6. Diagrama de Sequência — F5 (reload) com sessão ativa

```
Browser           main.dart         SplashRouter      Supabase.client     HomeScreen
   |                  |                   |                  |                  |
   | F5 (reload)      |                   |                  |                  |
   |----------------->|                   |                  |                  |
   |                  | runApp()          |                  |                  |
   |                  | home: SplashRouter|                  |                  |
   |                  |------------------>|                  |                  |
   |                  |                   | initState()      |                  |
   |                  |                   | _resolver()      |                  |
   |                  |                   |----------------->|                  |
   |                  |                   | currentUser != null ✅              |
   |                  |                   |<-----------------|                  |
   |                  |                   | resolverSessaoAtual()               |
   |                  |                   | → UserModel resolvido               |
   |                  |                   | _irParaApp(user)                    |
   |                  |                   |---------------------------------------->|
   |                  |                   |                  |     HomeScreen ✅ |
   |                  |                   |                  |                  |
   | (sem flash de LandingScreen — direto para HomeScreen)                     |
```

---

## 7. Diagrama de Sequência — CI/CD Deploy

```
Dev (push main)    GitHub Actions       pub.dev cache       vectorium-landing
       |                  |                   |                     |
  git push main           |                   |                     |
       |----------------->|                   |                     |
       |            flutter pub get           |                     |
       |                  |------------------>|                     |
       |            find drift_worker.dart    |                     |
       |                  |<------------------|                     |
       |            dart compile js           |                     |
       |            (dentro do projeto)       |                     |
       |            flutter build web         |                     |
       |            cp sqlite3.wasm → build/  |                     |
       |            cp drift_worker.js → build/                     |
       |            cp -r build/web → app/    |                     |
       |                  |-------------------------------------------->|
       |                  |          git commit + push [auto]           |
       |                  |<--------------------------------------------|  
       |            GitHub Pages atualiza                               |
       |            vectorium.tec.br/app ✅                              |
```

---

## 8. Diagrama de Casos de Uso

```
                 ┌─────────────────────────────┐
                 │         Metricora Web        │
                 │                             │
[Empreendedor]   │  ◆ Login com e-mail/senha   │
      ○          │  ◆ Login com Google OAuth   │
      │─────────>│  ◆ Cadastro de conta        │
                 │  ◆ Lançar venda / despesa   │
                 │  ◆ Ver dashboard / DRE      │
                 │  ◆ Filtrar por período      │
                 │  ◆ Sincronizar com nuvem    │
                 │  ◆ Instalar como PWA        │
                 │  ◆ F5 mantém sessão ativa ★ │
                 │  ◆ Logout                  │
                 └─────────────────────────────┘

[Visitante Landing]
      ○
      │─────────> ◆ Escolher modo de acesso (APK Android vs Web)
                  ◆ Baixar APK Android
                  ◆ Acessar Versão Web no navegador
                  ◆ Ver screenshots do produto
                  ◆ Consultar FAQ (diferença APK vs Web)

[CI/CD Bot]      ◆ Build automático após push
      ○          ◆ Deploy para vectorium-landing
      │─────────> ◆ Compilar drift_worker.dart.js
                  ◆ Copiar sqlite3.wasm
```

---

## 9. Diagrama de Componentes — Flutter Web Browser

```
┌─────────────────────────────────────────────────────────────────┐
│                      Browser (Tab)                              │
│                                                                  │
│  ┌────────────────────┐  ┌───────────────────────┐             │
│  │  Main Thread       │  │  Web Worker            │             │
│  │  (main.dart.js)    │  │  (drift_worker.dart.js)│             │
│  │                    │  │                        │             │
│  │  SplashRouter ★    │  │  WasmDatabase.open()   │             │
│  │  Flutter UI        │  │  loads sqlite3.wasm    │             │
│  │  GoogleAuthHelper ─────────────────────────── │             │
│  │  DatabaseHelper  ──────>  executa SQL em WASM  │             │
│  │  SupabaseService   │  │  persiste em IndexedDB │             │
│  │  Session           │  │                        │             │
│  └────────────────────┘  └───────────────────────┘             │
│           │ HTTPS                      │                        │
└─────────────────────────────────────────────────────────────────┘
              │
              ▼
   hxwjseeuwetmfodpjbhc.supabase.co
   ├── /auth/v1/token  (login)
   ├── /rest/v1/       (dados)
   └── /realtime/v1/   (websocket)
```

---

## 10. Mapa de Seções — Landing Page (ordem final)

```
vectorium.tec.br
│
├── [navbar]      Links + Versão Web + Baixar Android
├── [hero]        Headline, preço, CTA duplo, trust row
├── [#acesso]     Cards: APK Android (offline) | Versão Web (navegador)  ← RF-28
├── [#screenshots] Dashboard | DRE | Loja | Confeitaria               ← RF-29
├── [#features]   6 cards de funcionalidades
├── [#modos]      Salão | Confeitaria | Loja
├── [#depoimentos] 3 depoimentos reais                                ← RF-30
├── [#pricing]    R$0 · lista APK + Web separados
├── [#faq]        6 perguntas (incl. APK vs Web)
├── [cta-final]   CTA Android + CTA Web
└── [footer]      Links + copyright
```
