# Metricora | Landing Page & Conversão

**Vectorium Systems**

O **Metricora** é um ERP de bolso focado em micro-empreendedores (confeiteiros, barbeiros, varejo). Esta Landing Page é a porta de entrada para a conversão de novos usuários, projetada para alta performance, velocidade de carregamento e clareza na proposta de valor.

---

## 🚀 O que é o Metricora?

O Metricora resolve a desorganização financeira através de:

- **DRE Profissional:** Separação real entre dinheiro do sócio e dinheiro da empresa.
- **Engenharia de Manufatura:** Cálculo automático de custo de insumos e fichas técnicas.
- **Arquitetura Offline-First:** Operação 100% local, sem dependência de nuvem.
- **Backup na Nuvem:** Sincronização segura via Supabase para usuários PRO.
- **Assistente IA:** Análise inteligente dos dados com Gemini AI.

---

## 📂 Estrutura do Repositório

Esta página é estática e otimizada para SEO e conversão rápida.

| Arquivo / Pasta | Descrição |
|---|---|
| `index.html` | Página principal de vendas e apresentação |
| `vitalicio.html` | Checkout de alta conversão para licença PRO |
| `privacidade.html` | Termos e proteção de dados do usuário |
| `confeitaria.html` | Landing page segmentada — nicho confeitaria |
| `salao.html` | Landing page segmentada — nicho salão/barbearia |
| `vendedores.html` | Landing page segmentada — nicho varejo/vendedores |
| `baixar.html` | Página de download do APK |
| `obrigado.html` | Página pós-conversão |
| `app/` | Build Flutter Web — acessível em `vectorium.tec.br/app` |
| `/img` | Assets da marca, logos e prints da interface (otimizados) |

---

## 🛠️ Stack Tecnológica

- **Design:** Tailwind CSS (via CDN para otimização de cache)
- **Ícones:** Phosphor Icons
- **Tipografia:** Inter e Poppins (Google Fonts)
- **Animações:** CSS puro (CSS Transitions/Animations) para garantir baixo consumo de recursos no mobile
- **App Web:** Flutter Web (build em `/app`)

---

## 📈 Integrações Ativas

- **Facebook/Meta Pixel:** Rastreamento de conversão de compras (`Purchase`) e `PageViews`.
- **Download OTA (Over-the-Air):** Link direto para o binário `.apk` da versão vigente hospedado no GitHub Releases.

---

## ⚙️ Deploy & Manutenção

Esta Landing Page está configurada para deploy via **GitHub Pages** (domínio: `vectorium.tec.br`).

### Atualização de Versão
Ao lançar uma nova versão do APK (ex: `v1.0.11`), atualize o link de download em:
- `index.html`
- `vitalicio.html`
- `baixar.html`

### Build Flutter Web
Após cada release do app, buildar e substituir a pasta `/app`:
```bash
flutter build web --release
cp -r build/web/* vectorium-landing/app/
```

### Ofuscação
O APK fornecido nesta Landing Page deve estar sempre ofuscado para proteção de IP.

### SEO
As meta-tags estão configuradas para conversão direta. Evite alterar a hierarquia dos `<h1>` para manter o ranking.

---

## ⚖️ Compliance

Todo o conteúdo está em conformidade com as políticas de privacidade da Vectorium Systems, garantindo que o usuário entenda o modelo "Offline-First" antes da compra.

---

*Desenvolvido por Vectorium Systems © 2026 — A matemática não falha.*
