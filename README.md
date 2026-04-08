# Gôndolas Suprema — Sistema de Orçamentos

Sistema web para geração de orçamentos da Gôndolas Suprema.
Inclui catálogo de produtos, calculadora de preços, geração de PDF e compartilhamento via WhatsApp.

## 🚀 Como fazer deploy no Vercel (GRÁTIS)

### Passo 1: Criar conta no GitHub
1. Acesse https://github.com e crie uma conta (se não tiver)
2. Crie um novo repositório chamado `gondolas-suprema`

### Passo 2: Subir os arquivos
1. Faça upload de todos os arquivos deste projeto para o repositório
2. Ou use o Git:
```bash
cd gondolas-suprema
git init
git add .
git commit -m "primeiro commit"
git remote add origin https://github.com/SEU_USUARIO/gondolas-suprema.git
git push -u origin main
```

### Passo 3: Deploy no Vercel
1. Acesse https://vercel.com e faça login com GitHub
2. Clique em "New Project"
3. Selecione o repositório `gondolas-suprema`
4. Clique em "Deploy"
5. Pronto! Seu site estará no ar em ~2 minutos

### Passo 4: Domínio customizado (opcional)
- No painel do Vercel, vá em Settings > Domains
- Adicione seu domínio (ex: orcamento.gondolasuprema.com)

## 📱 Funcionalidades
- ✅ Cadastro de cliente com dados completos
- ✅ Catálogo com 148+ produtos
- ✅ Calculadora de orçamento com opções de altura
- ✅ Geração de PDF profissional com logo e marca d'água
- ✅ Compartilhamento via WhatsApp com PDF anexo
- ✅ Histórico de orçamentos
- ✅ Login de usuários

## 🔮 Futuro: Evolução para CRM
Para evoluir para um CRM completo, adicione:
- Supabase (banco de dados gratuito) para persistir dados
- Autenticação real com NextAuth.js
- Dashboard administrativo
- Controle de estoque
- Relatórios de vendas

## 📂 Estrutura do projeto
```
gondolas-suprema/
├── public/
│   └── logo.jpg          # Logo da empresa
├── src/
│   ├── app/
│   │   ├── layout.js     # Layout global
│   │   ├── page.js       # Página principal (carrega o app)
│   │   └── globals.css   # Estilos globais
│   ├── components/
│   │   └── App.jsx       # App completo (migrado do artifact)
│   └── lib/
│       ├── pdf.js        # Gerador de PDF com jsPDF
│       └── products.js   # Dados dos produtos
├── package.json
├── next.config.js
└── README.md
```
