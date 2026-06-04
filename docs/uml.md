# Diagramas UML — Vectorium / Metricora Web App

**Versão:** 1.0  
**Data:** 2026-06-04

---

## 1. Diagrama de Casos de Uso

```
+-----------------------------------------------------------+
|                  <<System>> Metricora Web                 |
|                                                           |
|  +----------------+     +-----------------------------+   |
|  |                |     |                             |   |
|  |   Registrar    |     |  Lançar Venda / Despesa     |   |
|  |   Conta        |     |                             |   |
|  +----------------+     +-----------------------------+   |
|                                                           |
|  +----------------+     +-----------------------------+   |
|  |                |     |                             |   |
|  |   Fazer Login  |     |  Visualizar DRE Mensal      |   |
|  |                |     |                             |   |
|  +----------------+     +-----------------------------+   |
|                                                           |
|  +----------------+     +-----------------------------+   |
|  |                |     |                             |   |
|  |  Fazer Backup  |     |  Exportar PDF               |   |
|  |  (Nuvem)       |     |                             |   |
|  +----------------+     +-----------------------------+   |
|                                                           |
+-----------------------------------------------------------+
          ^
          |
    [Empreendedor]
```

---

## 2. Diagrama de Classes (Modelos Principais)

```
+-------------------+       +---------------------+
|    UserModel      |       |   RegistroModel     |
+-------------------+       +---------------------+
| - id: int         |1    * | - id: int           |
| - name: String    |-------| - userId: int       |
| - email: String   |       | - produto: String   |
| - createdAt: Date |       | - receita: double   |
+-------------------+       | - cpv: double       |
                            | - frete: double     |
                            | - marketing: double |
                            | - despesas: double  |
                            | - proLabore: double |
                            | - lucro: double     |
                            | - data: String      |
                            | - notas: String     |
                            +---------------------+

+---------------------+       +----------------------+
|  FornecedorModel    |       |   SessionModel       |
+---------------------+       +----------------------+
| - id: int           |       | + currentUser:       |
| - userId: int       |       |     UserModel?       |
| - nome: String      |       | + isLoggedIn: bool   |
| - site: String?     |       +----------------------+
| - whatsapp: String? |
| - especialidade:    |
|     String?         |
| - pedidoMinimo:     |
|     double?         |
| - avaliacao: int    |
| - supabaseId: String|
+---------------------+
```

---

## 3. Diagrama de Sequência — Fluxo de Cadastro

```
Usuário       RegisterScreen     SupabaseAuth      Database
   |                |                 |                |
   |--preenche----> |                 |                |
   |  formulário    |                 |                |
   |                |--valida campos->|                |
   |                |                 |                |
   |                |--signUp(email,  |                |
   |                |   senha, nome)->|                |
   |                |                 |--cria user---> |
   |                |                 |<--user_id------|
   |                |<--AuthResponse--|                |
   |                |                 |                |
   |                |--insere perfil na tabela users-->|
   |                |<---------------------------------|
   |<--navega para--|                 |                |
   |  Dashboard     |                 |                |
```

---

## 4. Diagrama de Sequência — Fluxo de Login

```
Usuário       LoginScreen        SupabaseAuth      Session
   |                |                 |                |
   |--email+senha-> |                 |                |
   |                |--signIn()------>|                |
   |                |<--Session/Error-|                |
   |                |--Session.set()--|--------------->|
   |<--Dashboard----|                 |                |
```

---

## 5. Diagrama de Fluxo — Tela de Cadastro (FIX-01)

```
[Abrir /app] --> [Splash] --> [LoginScreen]
                                   |
                         [Toca "Criar conta"]
                                   |
                         [RegisterScreen]
                          ___________________
                         | Logo Metricora    |
                         | Campo: Nome       |
                         | Campo: E-mail     |
                         | Campo: Senha      |
                         | Campo: Confirmar  |
                         | Botão [Cadastrar] |
                         | Link [Já tenho    |
                         |       conta]      |
                         |___________________|
                                   |
                      [Valida localmente]
                          /         \
                    [Erro]         [OK]
                  [Mostra msg]      |
                              [Chama Supabase
                               signUp()]
                               /        \
                          [Erro]        [OK]
                       [Mostra msg] [Vai p/ Dashboard]
```

---

## 6. Arquitetura de Deploy

```
+------------------+         +------------------+
|  GitHub Pages    |         |   Supabase       |
|  vectorium.tec   |         |   (cloud)        |
|  .br/app         |         |                  |
|                  |  HTTPS  | - Auth           |
|  Flutter Web     |<------->| - PostgreSQL     |
|  (main.dart.js)  |         | - Storage        |
+------------------+         +------------------+
        ^
        |
   [CNAME DNS]
   vectorium.tec.br
        |
  brunomachado21
  .github.io/
  vectorium-landing
```
