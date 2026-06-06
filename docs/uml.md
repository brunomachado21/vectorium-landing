# UML — Vectorium / Metricora

**Versão:** 1.7  
**Data:** 2026-06-06

---

## 1. Diagrama de Classes — Arquitetura Central

```mermaid
classDiagram
    class UserModel {
        +int id
        +String username
        +String niche
        +String licenseType
        +bool isPro
    }
    class RegistroModel {
        +int id
        +int userId
        +double receita
        +double despesas
        +String produto
        +DateTime data
        +copyWithUserId(int) RegistroModel
        +fromSupabase(Map) RegistroModel$
    }
    class Session {
        +UserModel currentUser$
    }
    class DatabaseHelper {
        +instance$
        +registerUser(UserModel) Future~int~
        +getUserByName(String) Future~UserModel?~
        +getUserEmail(String) Future~String?~
        +setUserEmail(String, String) Future~void~
        +readRegistrosDoUsuario(userId) Future
        +getRegistrosPorPeriodo(userId, inicio, fim) Future
        +getEvolucaoMensal(userId, meses) Future
        +getMeta(userId, ano, mes) Future
        +saveMeta(userId, ano, mes) Future
        +create(RegistroModel) Future
    }
    class SupabaseService {
        +upsertProfile(username, licenseType, niche, email)$
        +registrarEmailAuth(email, senha, username, licenseType, niche)$
        +loginEmailAuth(email, senha)$
        +getUserProfile()$
    }
    class SyncService {
        +pullPerfil()$ Future~void~
        +listenRealtime(userId)$
        +stopRealtime()$
    }
    class GoogleAuthHelper {
        +disponivel$ bool
        +entrar(BuildContext) Future~UserModel?~
        +sair() Future~void~
    }
    class SupabaseBackupService {
        +fazerBackup()$ Future~BackupResult~
        +fazerRestore()$ Future~RestoreResult~
        +getInfoBackup()$ Future~BackupInfo~
    }
    class DeviceService {
        +verificarLimite(userId, licenseType)$ Future~DeviceCheckResult~
        +registrarDispositivo(userId)$ Future~void~
        +listarDispositivos()$ Future~List~
        +revogarDispositivo(deviceId)$ Future~void~
        +revogarDispositivoAtual()$ Future~void~
        +iniciarEscutaRevogacao(userId, onRevogado)$
        +pararEscutaRevogacao()$
        +deviceIdAtual()$ Future~String~
    }
    class DeviceCheckResult {
        +DeviceCheckStatus status
        +String errorMessage
        +String replacedDeviceName
        +bool bloqueado
    }
    class DeviceCheckStatus {
        <<enumeration>>
        ok
        replacedSamePlatform
        limitReached
    }
    class LoginScreen {
        -_fazerLogin()
        -_loginEmail()
        -_loginGoogle()
    }
    class HomeScreen {
        +initState()
        -_verificarOnboarding()
        -_verificarBannerEmail()
    }
    class DispositivosScreen {
        -_buildUsoCard()
        -_buildDeviceCard()
        -_revogar(deviceId)
    }
    class SplashRouter {
        -_resolver()
    }
    class LicenseManager {
        +bool isPro$
    }
    class GeminiService {
        +gerarAnaliseFinanceira(registros, nicho)$ Future
        +gerarCoachVendas(registros, nicho)$ Future
    }

    Session --> UserModel
    LoginScreen ..> DeviceService : verificarLimite
    LoginScreen ..> DeviceService : registrarDispositivo
    LoginScreen ..> SyncService : pullPerfil
    LoginScreen ..> SupabaseService : loginEmailAuth
    GoogleAuthHelper ..> DeviceService : verificarLimite
    GoogleAuthHelper ..> DeviceService : registrarDispositivo
    GoogleAuthHelper ..> DatabaseHelper : getUserByName / registerUser / setUserEmail
    GoogleAuthHelper ..> SyncService : pullPerfil
    HomeScreen ..> SyncService : listenRealtime / stopRealtime
    HomeScreen ..> DatabaseHelper : getUserEmail
    HomeScreen ..> DeviceService : iniciarEscutaRevogacao
    DispositivosScreen ..> DeviceService : listarDispositivos / revogarDispositivo
    SplashRouter ..> SupabaseService
    SplashRouter ..> DatabaseHelper
    SupabaseBackupService ..> DatabaseHelper
    SupabaseBackupService ..> RegistroModel
    DeviceService ..> DeviceCheckResult
    DeviceCheckResult --> DeviceCheckStatus
    LicenseManager --> UserModel

    note for DeviceService "kDeviceLimits: FREE=1, PRO=2, PRO+=999\nverificarLimite: limite total ANTES de substituição de plataforma"
    note for LoginScreen "Todo caminho de login chama\nverificarLimite antes de registrarDispositivo"
    note for SplashRouter "Resolve sessão (Supabase ou SharedPrefs)\nantes de renderizar qualquer tela"
```

---

## 2. Fluxo de Autenticação + Controle de Dispositivos

```mermaid
flowchart TD
    A([Usuário abre o app]) --> SR[SplashRouter]
    SR --> SR1{Supabase.currentUser?}
    SR1 -- Sim --> HOME
    SR1 -- Não --> SR2{SharedPrefs saved_user?}
    SR2 -- Sim --> HOME
    SR2 -- Não --> ENTRADA

    ENTRADA --> C{Método de login}

    C -- Local --> D[_fazerLogin]
    D --> D1[authenticateUser SQLite]
    D1 --> D2[verificarLimite DeviceService]
    D2 --> D3{Dentro do limite?}
    D3 -- Não --> ERR[Exibe erro de limite]
    D3 -- Sim --> D4[pullPerfil + registrarDispositivo]
    D4 --> D5[Session.currentUser]
    D5 --> HOME

    C -- Email --> E[_loginEmail]
    E --> E1[loginEmailAuth Supabase]
    E1 --> E2[verificarLimite DeviceService]
    E2 --> E3{Dentro do limite?}
    E3 -- Não --> ERR
    E3 -- Sim --> E4[registrarDispositivo]
    E4 --> E5[Session.currentUser]
    E5 --> HOME

    C -- Google --> F[GoogleAuthHelper.entrar]
    F --> F1{kIsWeb?}
    F1 -- Sim --> F2[return null — redirect em andamento]
    F1 -- Não --> F3{getUserByName?}
    F3 -- novo --> F4[registerUser + setUserEmail]
    F4 --> F5[verificarLimite DeviceService]
    F3 -- retornante --> F6[pullPerfil]
    F6 --> F5
    F5 --> F7{Dentro do limite?}
    F7 -- Não --> ERR
    F7 -- Sim --> F8[registrarDispositivo]
    F8 --> F9[Session.currentUser]
    F9 --> HOME

    HOME([HomeScreen])
    HOME --> H1[iniciarEscutaRevogacao]
    HOME --> H2[_verificarBannerEmail]
    H1 --> H3{device_sessions DELETE?}
    H3 -- Sim --> LOGOUT[Logout forçado]
```

---

## 3. Fluxo de Controle de Dispositivos

```mermaid
flowchart TD
    A[Login bem-sucedido] --> B[DeviceService.verificarLimite]
    B --> C[Busca device_sessions do user_id]
    C --> D{device_id já registrado?}
    D -- Sim --> OK[DeviceCheckStatus.ok]
    D -- Não --> E{lista.length >= limite?}
    E -- Sim --> BLOCK[DeviceCheckStatus.limitReached]
    BLOCK --> MSG[Exibe mensagem + link para DispositivosScreen]
    E -- Não --> F{Mesma plataforma existe?}
    F -- Sim --> G[Deleta dispositivo antigo da plataforma]
    G --> REP[DeviceCheckStatus.replacedSamePlatform]
    REP --> REG[registrarDispositivo]
    F -- Não --> REG
    OK --> REG
    REG --> SESS[Sessão ativa registrada em device_sessions]

    note1[FREE: limite=1\nPRO: limite=2\nPRO+: limite=999]
    SESS --> REAL[iniciarEscutaRevogacao]
    REAL --> W{DELETE no device_sessions?}
    W -- Sim --> FORCE[Logout forçado\n+ navega para LoginScreen]
    W -- Não --> ATIVO[Sessão continua ativa]
```

---

## 4. Diagrama de Sequência — Login Local com Verificação de Dispositivo

```mermaid
sequenceDiagram
    actor U as Usuário
    participant LS as LoginScreen
    participant DB as DatabaseHelper
    participant DS as DeviceService
    participant SS as SyncService
    participant SB as Supabase

    U->>LS: Insere usuário + senha
    LS->>DB: authenticateUser(username, senha)
    DB-->>LS: UserModel
    LS->>DS: verificarLimite(userId, licenseType)
    DS->>SB: SELECT device_sessions WHERE user_id
    SB-->>DS: lista de sessões
    alt lista.length >= limite
        DS-->>LS: limitReached
        LS-->>U: Erro: limite atingido
    else dentro do limite
        DS-->>LS: ok / replacedSamePlatform
        LS->>SS: pullPerfil()
        SS->>SB: SELECT profiles WHERE id
        SB-->>SS: dados atualizados
        SS->>DB: UPDATE users SET license/niche/email
        LS->>DS: registrarDispositivo(userId)
        DS->>SB: UPSERT device_sessions
        LS->>LS: Session.currentUser = user
        LS-->>U: Navega para HomeScreen
    end
```

---

## 5. Diagrama de Componentes — Infraestrutura

```mermaid
flowchart LR
    subgraph GitHub
        REPO_APP[metricora]
        REPO_LAND[vectorium-landing]
        ACTIONS[GitHub Actions]
    end

    subgraph CDN
        PAGES[GitHub Pages]
    end

    subgraph Produção
        DOMAIN[vectorium.tec.br]
        APP[vectorium.tec.br/app]
    end

    subgraph Backend
        SB_AUTH[Supabase Auth]
        SB_DB[Supabase PostgreSQL]
        SB_RT[Supabase Realtime]
    end

    REPO_APP -->|push main| ACTIONS
    ACTIONS -->|flutter build web| REPO_LAND
    REPO_LAND --> PAGES
    PAGES --> DOMAIN
    PAGES --> APP
    APP --> SB_AUTH
    APP --> SB_DB
    APP --> SB_RT
    SB_RT -->|DELETE device_sessions| APP
```
