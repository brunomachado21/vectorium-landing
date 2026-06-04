# Documento de Requisitos — Vectorium / Metricora Web App

**Versão:** 1.0  
**Data:** 2026-06-04  
**Responsável:** Bruno Machado  
**Repositório de landing:** [vectorium-landing](https://github.com/brunomachado21/vectorium-landing)  
**URL produção:** https://vectorium.tec.br/app

---

## 1. Visão Geral

O Metricora Web App é a versão Flutter Web do aplicativo Metricora, servida em `vectorium.tec.br/app`. Ele permite que empreendedores registrem vendas, despesas, gerem DRE e acompanhem métricas financeiras diretamente no navegador, sem instalação.

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
| RF-01 | O sistema deve permitir **login** com e-mail e senha via Supabase Auth | Alta |
| RF-02 | O sistema deve permitir **cadastro** de novo usuário com nome, e-mail e senha | Alta |
| RF-03 | A tela de cadastro deve ter o **mesmo layout visual** da tela de login (fundo escuro, logo centralizada, campos estilizados, botão amberAccent) | Alta |
| RF-04 | Após cadastro bem-sucedido, redirecionar para o painel principal | Alta |
| RF-05 | Exibir mensagem de erro clara em caso de e-mail já cadastrado ou senha fraca | Média |
| RF-06 | O sistema deve permitir **recuperação de senha** via e-mail | Média |

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

### 3.4 Backup / Sync

| ID | Requisito | Prioridade |
|---|---|---|
| RF-14 | Sincronizar dados com Supabase (backup em nuvem) | Alta |
| RF-15 | Na versão Web, usar Supabase como banco primário (sem SQLite local) | Alta |

---

## 4. Requisitos Não Funcionais

| ID | Requisito | Categoria |
|---|---|---|
| RNF-01 | Interface responsiva para desktop e mobile (mínimo 320px de largura) | Usabilidade |
| RNF-02 | Tema escuro consistente em todas as telas (AppConfigs.*) — sem hardcodes de cor | Manutenibilidade |
| RNF-03 | Tempo de carregamento inicial (TTI) < 5s em conexão 4G | Performance |
| RNF-04 | Autenticação protegida por HTTPS (Supabase + CNAME vectorium.tec.br) | Segurança |
| RNF-05 | Dados de usuário isolados por `user_id` em todas as queries | Segurança |
| RNF-06 | Build Flutter Web otimizado (tree-shaking, minificação) | Performance |

---

## 5. Correções Pendentes (Backlog Imediato)

| ID | Descrição | Status |
|---|---|---|
| FIX-01 | Tela de cadastro (`RegisterScreen`) — layout deve ser idêntico ao `LoginScreen` (fundo dark, logo, campos, botão amberAccent) | 🔴 Pendente |
| FIX-02 | Remover hardcodes de cor em `historico_tab.dart` | ✅ Concluído (2026-06-04) |
| FIX-03 | Remover hardcodes de cor em `backup_screen.dart` | ✅ Concluído (2026-06-04) |
| FIX-04 | Remover hardcodes de cor em `contabilidade_screen.dart` | ✅ Concluído (2026-06-04) |
| FIX-05 | Remover hardcodes de cor em `atacadistas_screen.dart` | ✅ Concluído (2026-06-04) |

---

## 6. Critérios de Aceite — FIX-01 (Tela de Cadastro)

- [ ] Mesmo fundo (`AppConfigs.fundoApp`) que a tela de login
- [ ] Logo Metricora centralizada no topo
- [ ] Campos: Nome, E-mail, Senha, Confirmar Senha — estilizados com `AppConfigs.*`
- [ ] Botão principal com `backgroundColor: Colors.amberAccent, foregroundColor: Colors.black`
- [ ] Link "Já tenho conta? Entrar" na parte inferior
- [ ] Validação inline de senha fraca e e-mail inválido
- [ ] Loading indicator durante a chamada ao Supabase
