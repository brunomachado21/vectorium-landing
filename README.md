# Metricora | Landing Page & Web App
**Vectorium Systems**

O Metricora é um ERP de bolso para micro-empreendedores (confeiteiros, barbeiros, varejo, atacadistas). Este repositório hospeda a **landing page de conversão** em `vectorium.tec.br` e o **app Flutter Web** em `vectorium.tec.br/app`, servidos via GitHub Pages.

## 🚀 O que é o Metricora?

O Metricora resolve a desorganização financeira de pequenos negócios através de:
- **DRE Profissional:** Separação real entre dinheiro do sócio e dinheiro da empresa.
- **Engenharia de Manufatura:** Cálculo automático de custo de insumos e fichas técnicas.
- **Contabilidade Simplificada:** Métricas de impostos, média de vendas e evolução mensal.
- **Backup em Nuvem:** Sincronização com Supabase para acesso multi-dispositivo.

## 📂 Estrutura do Repositório

```
vectorium-landing/
├── index.html            # Landing page principal (SEO + conversão)
├── vitalicio.html        # Checkout de alta conversão — licença PRO Vitálicio
├── confeitaria.html      # Landing vertical: Metricora Confeitaria
├── salao.html            # Landing vertical: Metricora Salão
├── vendedores.html       # Landing vertical: Metricora Vendedores
├── baixar.html           # Página de download do APK
├── privacidade.html      # Política de privacidade (LGPD)
├── termos.html           # Termos de uso
├── obrigado.html         # Pós-checkout / agradecimento
├── app/                  # Flutter Web build (vectorium.tec.br/app)
├── img/                  # Assets da marca, logos, screenshots
├── docs/                 # Documentação técnica
│   ├── requirements.md    # Requisitos funcionais e não funcionais
│   ├── uml.md             # Diagramas UML (casos de uso, classes, sequência)
│   └── engineering_log.md # Log cronológico de decisões técnicas
└── CNAME                 # vectorium.tec.br
```

## 🛠️ Stack Tecnológica

### Landing Page
- **Design:** Tailwind CSS (via CDN).
- **Ícones:** Phosphor Icons.
- **Tipografia:** Inter e Poppins (Google Fonts).
- **Animações:** CSS puro (Transitions/Animations) para baixo consumo no mobile.

### Web App (`/app`)
- **Framework:** Flutter Web (Dart compilado para JS).
- **Backend:** Supabase (PostgreSQL + Auth + Storage).
- **Autenticação:** E-mail/senha e Google OAuth via Supabase Auth.
- **Design System:** `AppConfigs` em `styles.dart` — design tokens centralizados.

## 📈 Integrações Ativas
- **Facebook/Meta Pixel:** Rastreamento de `Purchase` e PageViews.
- **Download OTA (Over-the-Air):** Link direto para o binário `.apk` hospedado no GitHub Releases.
- **Supabase:** Auth + banco de dados em nuvem para a versão Web.

## ⚙️ Deploy & Manutenção

Este repositório é servido via **GitHub Pages** com CNAME apontando para `vectorium.tec.br`.

### Atualizar a landing page
Edite os arquivos `.html` diretamente e faça push na `main`.

### Atualizar o Web App (`/app`)
```bash
# No repositório metricora (source Dart):
flutter build web --release
cp -r build/web/* /caminho/para/vectorium-landing/app/
cd /caminho/para/vectorium-landing
git add app/
git commit -m "chore: build web vX.X.X"
git push
```

### Atualizar versão do APK
Ao lançar nova versão (ex: v1.0.8), atualize o link de download em `index.html`, `vitalicio.html` e `baixar.html`, e atualize `metricora_version.json`.

### Boas práticas
- **Ofuscação:** O APK deve estar sempre ofuscado (proteção de IP).
- **SEO:** Não altere a hierarquia dos `<h1>` nas landing pages para manter ranking.
- **AppConfigs:** Nunca hardcode cores nas telas Flutter. Use sempre `AppConfigs.*` de `styles.dart`.

## 📚 Documentação

Consulte a pasta [`docs/`](./docs/) para:
- [Requisitos Funcionais e Não Funcionais](./docs/requirements.md)
- [Diagramas UML](./docs/uml.md)
- [Engineering Log](./docs/engineering_log.md)

## ⚖️ Compliance

Todo o conteúdo está em conformidade com a LGPD e as políticas de privacidade da Vectorium Systems. A política de privacidade está disponível em [`privacidade.html`](./privacidade.html).

---
**Desenvolvido por Vectorium Systems © 2026**  
*A matemática não falha.*
