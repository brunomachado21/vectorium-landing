# UML — Vectorium / Metricora

**Versão:** 1.2  
**Data:** 2026-06-04

---

## 1. Diagrama de Arquitetura de Deploy

```
┌───────────────────────────────────────────────┐
│          brunomachado21/metricora (Flutter)          │
│   push em main → GitHub Actions [deploy_web.yml]    │
│                                                      │
│  1. flutter pub get                                  │
│  2. cp drift_worker.dart → web/ (do pub cache)       │
│  3. dart compile js → web/drift_worker.dart.js       │
│  4. flutter build web --release --base-href /app/    │
│  5. cp sqlite3.wasm (pub cache) → build/web/         │
│  6. cp drift_worker.dart.js    → build/web/          │
└───────────────────────────────────────────────┘
                        │
                        │ cp -r build/web → app/
                        ▼
┌───────────────────────────────────────────────┐
│    brunomachado21/vectorium-landing                 │
│    branch: main                                      │
│                                                      │
│    index.html          ← landing page estática       │
│    app/                ← Flutter Web build           │
│    ├── index.html       (com CSP + manifest)          │
│    ├── main.dart.js     (app compilado)              │
│    ├── sqlite3.wasm     (← copiado do pub cache)      │
│    ├── drift_worker.dart.js (← compilado no CI)      │
│    ├── flutter_bootstrap.js                          │
│    └── icons/           (PNGs válidos 192+512)        │
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

## 2. Diagrama de Classes — Core (Metricora)

```
┌─────────────────────┐   ┌────────────────────────┐
│    DatabaseHelper       │   │      SyncService          │
│    (Singleton)          │   │                          │
│  +instance: static      │   │ +syncPendentes()         │
│  +init()               │   │ +pullFromSupabase()      │
│  +openDefaultConn()    │◄──│ +listenRealtime(uid)     │
│  [Web: WasmDatabase]   │   │ +stopRealtime()          │
│  [Mobile: sqflite]     │   └────────────────────────┘
└─────────────────────┘
         │ usa
         ▼
┌─────────────────────┐   ┌────────────────────────┐
│    SupabaseService      │   │  BackgroundSyncService   │
│                         │   │                          │
│ +loginComEmail()        │   │ +iniciar(userId)         │
│ +registrarEmailAuth()   │   │ +parar()                 │
│ +logout()               │   │ Timer: 15min             │
│ +sincronizarPerfil()    │   │ AppLifecycleObserver     │
└─────────────────────┘   └────────────────────────┘

┌─────────────────────┐   ┌────────────────────────┐
│    DeviceService        │   │     Session               │
│                         │   │                          │
│ +registrarDispositivo() │   │ +currentUser: UserModel? │
│ +verificarLimite()      │   │ (static, global)         │
│ +revogarAtual()         │   └────────────────────────┘
│ FREE≤1, PRO≤2 devices   │
└─────────────────────┘
```

---

## 3. Diagrama de Sequência — Login Web (com WASM)

```
Browser          main.dart      DatabaseHelper    WasmDatabase      SupabaseService
   |                 |                |                 |                  |
   | abre /app/      |                |                 |                  |
   |---------------->|                |                 |                  |
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
   |                 |  ✔ SyncService.syncPendentes()                        |
   |                 |  ✔ SyncService.pullFromSupabase()                     |
   |                 |<--------------------------------------------------------|
   | tela inicial    |                                  |                  |
   |<----------------|                                  |                  |
```

---

## 4. Diagrama de Sequência — CI/CD Deploy

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
       |            cp drift_worker.js → build/                    |
       |            cp -r build/web → app/    |                     |
       |                  |-------------------------------------------->|
       |                  |          git commit + push [auto]           |
       |                  |<--------------------------------------------|  
       |            GitHub Pages atualiza                               |
       |            vectorium.tec.br/app ✅                              |
```

---

## 5. Diagrama de Casos de Uso

```
                 ┌─────────────────────────────┐
                 │         Metricora Web              │
                 │                                   │
[Empreendedor]   │  ◆ Login com e-mail/senha         │
      ○          │  ◆ Login com Google               │
      │─────────>│  ◆ Cadastro de conta               │
                 │  ◆ Lançar venda / despesa         │
                 │  ◆ Ver dashboard / DRE            │
                 │  ◆ Filtrar por período            │
                 │  ◆ Sincronizar com nuvem          │
                 │  ◆ Instalar como PWA              │
                 │  ◆ Logout                         │
                 └─────────────────────────────┘

[CI/CD Bot]      ◆ Build automático após push
      ○          ◆ Deploy para vectorium-landing
      │─────────> ◆ Compilar drift_worker.dart.js
                  ◆ Copiar sqlite3.wasm
```

---

## 6. Diagrama de Componentes — Flutter Web Browser

```
┌─────────────────────────────────────────────────────────────────┐
│                      Browser (Tab)                              │
│                                                                  │
│  ┌────────────────────┐  ┌───────────────────────┐  │
│  │  Main Thread          │  │  Web Worker              │  │
│  │  (main.dart.js)       │  │  (drift_worker.dart.js)  │  │
│  │                      │  │                         │  │
│  │  Flutter UI           │  │  WasmDatabase.open()     │  │
│  │  DatabaseHelper   ─────>│  │  loads sqlite3.wasm     │  │
│  │  SupabaseService      │  │  executa SQL em WASM     │  │
│  │  Session              │  │  persiste em IndexedDB   │  │
│  └────────────────────┘  └───────────────────────┘  │
│           │ HTTPS                      │                      │
└─────────────────────────────────────────────────────────────────┘
              │
              ▼
   hxwjseeuwetmfodpjbhc.supabase.co
   ├── /auth/v1/token  (login)
   ├── /rest/v1/       (dados)
   └── /realtime/v1/   (websocket)
```
