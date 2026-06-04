# Engineering Log — Vectorium / Metricora

Registro cronológico de decisões técnicas, correções e melhorias.

---

## 2026-06-04

### [FIX] Remoção de hardcodes dark em 4 telas — Metricora Flutter

**Commit:** `dd04d79` (repo: metricora)  
**Arquivos:** `historico_tab.dart`, `backup_screen.dart`, `contabilidade_screen.dart`, `atacadistas_screen.dart`

**Problema:** As 4 telas usavam cores hardcoded (`Color(0xFF0D0D0D)`, `Color(0xFF1A1A2E)`, `Color(0xFF1E1E2E)`, `Colors.white`, `Colors.white54`, `Colors.white38`, `Colors.white30`, `Colors.white24`, `Colors.white12`) em vez das constantes centralizadas de `styles.dart`.

**Impacto:** Impossibilidade de mudança de tema sem editar dezenas de arquivos. Violação do princípio de fonte única de verdade para design tokens.

**Solução:** Substituição sistemática por `AppConfigs.fundoApp`, `AppConfigs.appBarBg`, `AppConfigs.fundoCard`, `AppConfigs.textoTitulo`, `AppConfigs.textoGeral`, `AppConfigs.textoSecundario`, `AppConfigs.principal`.

**Resultado:** 0 hardcodes remanescentes nas 4 telas. Sistema pronto para suportar múltiplos temas (light mode, white-label) com alteração em 1 arquivo.

---

### [BACKLOG] Tela de cadastro — inconsistência visual com LoginScreen

**URL afetada:** `vectorium.tec.br/app` (rota de registro)

**Problema:** A `RegisterScreen` (ou equivalente) não segue o mesmo design da `LoginScreen`. Divergências observadas: fundo incorreto, ausência de logo, campos sem estilização `AppConfigs.*`, botão fora do padrão amberAccent.

**Ação:** Criar `RegisterScreen` com layout espelhado do `LoginScreen`:  
- Fundo: `AppConfigs.fundoApp`  
- Logo centralizada  
- Campos: Nome, E-mail, Senha, Confirmar Senha  
- Botão: `amberAccent / Colors.black`  
- Link de retorno ao Login  
- Validação inline + loading state  

**Status:** 🔴 Pendente — próxima sprint

---

### [DOCS] Criação de documentação técnica no vectorium-landing

**Commit:** este  
**Arquivos criados:**
- `docs/requirements.md` — Requisitos funcionais e não funcionais
- `docs/uml.md` — Diagramas de casos de uso, classes, sequência e deploy
- `docs/engineering_log.md` — Este arquivo

**Motivação:** Formalizar o estado atual do projeto, registrar decisões técnicas e criar base para onboarding de colaboradores.

---

## 2026-05-XX (histórico estimado)

### [INFRA] Deploy Flutter Web via GitHub Pages

**Decisão:** Usar GitHub Pages com CNAME `vectorium.tec.br` para servir o build Flutter Web em `/app`.

**Razão:** Zero custo, integração nativa com repositório, deploy via push na branch `main`. Build gerado localmente (`flutter build web --release`) e commitado na pasta `/app`.

**Trade-off:** Deploy manual (sem CI/CD automatizado ainda). Cada nova versão requer build local e push. **Próximo passo:** automatizar via GitHub Actions (`flutter build web` + commit automático ao `/app`).

---

### [INFRA] Supabase como backend

**Decisão:** Usar Supabase (PostgreSQL + Auth) como backend único para autenticação e persistência de dados na versão Web.

**Razão:** Compatível com o Flutter SDK (`supabase_flutter`), já em uso no app mobile, oferece Auth pronto, Row Level Security (RLS) para isolamento por `user_id`.

**Configuração:** Credenciais via `supabase_service.dart`. RLS ativo em todas as tabelas: `registros`, `fornecedores`, `users`.

---

### [ARCH] Centralização de design tokens em `styles.dart`

**Decisão:** Criar `lib/styles.dart` com classe `AppConfigs` contendo todas as constantes de cor e configuração visual.

**Razão:** Suporte a múltiplas verticais (Metricora Vendedores, Metricora Barber, Confeitaria) com white-label via uma única alteração de arquivo.

**Padrão adotado:**
```dart
class AppConfigs {
  static const Color fundoApp      = Color(0xFF0D0D0D);
  static const Color appBarBg      = Color(0xFF1A1A2E);
  static const Color fundoCard     = Color(0xFF1E1E2E);
  static const Color textoTitulo   = Colors.white;
  static const Color textoGeral    = Colors.white70;  // aprox.
  static const Color textoSecundario = Colors.white54; // aprox.
  static const Color principal     = Colors.amberAccent;
  static String      nomeApp       = 'Metricora';
}
```

---

## Próximas Ações (Roadmap Imediato)

| Prioridade | Item | Responsável |
|---|---|---|
| 🔴 Alta | FIX-01: Corrigir RegisterScreen para igualar LoginScreen | Bruno |
| 🟡 Média | CI/CD: GitHub Actions para build e deploy automático do Flutter Web | Bruno |
| 🟡 Média | Tela de recuperação de senha (ForgotPasswordScreen) | Bruno |
| 🟢 Baixa | Light mode / alternância de tema | Futuro |
| 🟢 Baixa | PWA: melhorar manifest e offline support | Futuro |
