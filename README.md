# Analytics Agent 📊

Agente que coleta dados do Google Analytics 4 a cada hora (09h–20h) e envia resumos via Telegram.

---

## Pré-requisitos

- Node.js 18+ instalado
- Conta no Google Cloud com faturamento ativado (API é gratuita dentro dos limites)
- Bot no Telegram (criado via @BotFather)
- Conta na Anthropic (para a API do Claude)

---

## Passo 1 — Configurar o Google Analytics API

### 1.1 Ativar a API no Google Cloud

1. Acesse: https://console.cloud.google.com/
2. Crie um projeto novo (ou use um existente)
3. No menu lateral, vá em **APIs e Serviços → Biblioteca**
4. Busque por **"Google Analytics Data API"** e clique em **Ativar**

### 1.2 Criar uma Service Account (conta de serviço)

1. Vá em **APIs e Serviços → Credenciais**
2. Clique em **+ Criar Credenciais → Conta de Serviço**
3. Dê um nome (ex: "analytics-agent") e clique em **Criar**
4. Na tela seguinte, clique em **Concluir** (sem precisar de papel especial)
5. Na lista de Service Accounts, clique no email criado
6. Vá na aba **Chaves → Adicionar Chave → Criar nova chave → JSON**
7. O arquivo JSON vai baixar automaticamente — **guarde ele com segurança**
8. Renomeie para `google-credentials.json` e coloque na pasta do projeto

### 1.3 Dar acesso ao Google Analytics

1. Acesse: https://analytics.google.com/
2. Vá em **Admin → Gerenciamento de acesso à propriedade**
3. Clique em **+** para adicionar um usuário
4. Cole o **email da Service Account** (ex: analytics-agent@seu-projeto.iam.gserviceaccount.com)
5. Permissão: **Leitor** é suficiente
6. Clique em **Adicionar**

### 1.4 Pegar o Property ID

1. No Analytics, vá em **Admin → Configurações da propriedade**
2. Copie o **ID da propriedade** (número de 9 dígitos)
3. No `config.js`, use o formato: `'properties/XXXXXXXXX'`

---

## Passo 2 — Configurar o Telegram Bot

### 2.1 Criar o bot

1. Abra o Telegram e busque por **@BotFather**
2. Envie `/newbot`
3. Escolha um nome e um username para o bot
4. O BotFather vai te dar um **token** — guarde ele

### 2.2 Descobrir o Chat ID

1. Envie uma mensagem qualquer para o seu bot
2. Acesse no navegador:
   ```
   https://api.telegram.org/bot<SEU_TOKEN>/getUpdates
   ```
3. Procure o campo `"chat": { "id": XXXXXXXX }` — esse é o seu Chat ID

---

## Passo 3 — Configurar o projeto

```bash
# 1. Instalar dependências
npm install

# 2. Criar o arquivo de configuração
cp .env.example .env

# 3. Editar o .env com seus valores reais
# (use qualquer editor de texto)

# 4. Editar o config.js com os seus sites
```

---

## Passo 4 — Testar

```bash
# Para testar se tudo está funcionando (roda o job imediatamente):
# Descomente a última linha do index.js:
#   runJob();

node index.js
```

Se tudo estiver certo, você vai receber uma mensagem no Telegram em segundos.

---

## Passo 5 — Rodar em produção

### Opção A: PM2 (recomendado para VPS/servidor)

```bash
npm install -g pm2
pm2 start index.js --name analytics-agent
pm2 save
pm2 startup  # para reiniciar automaticamente no boot
```

### Opção B: Rodar manualmente

```bash
npm start
```

---

## Estrutura do projeto

```
analytics-agent/
├── index.js              # Agendador principal
├── analytics.js          # Coleta dados do GA4
├── summarizer.js         # Gera resumo via Claude
├── telegram.js           # Envia para o Telegram
├── config.js             # Seus sites e configurações
├── google-credentials.json  # Chave da Service Account (NÃO suba pro Git)
├── .env                  # Suas variáveis de ambiente (NÃO suba pro Git)
├── .env.example          # Modelo do .env (pode subir pro Git)
└── package.json
```

---

## Exemplo de mensagem recebida

```
📊 *CRM Imobiliário* — 14:00
👥 342 usuários · 89 novos
📄 1.204 páginas vistas · 421 sessões
⏱ Sessão média: 3m 12s · Rejeição: 42%
✅ Tráfego estável, dentro da média do dia.
```

---

## Solução de problemas

**"PERMISSION_DENIED" da API do Google**
→ A Service Account não foi adicionada como leitora na propriedade. Refaça o Passo 1.3.

**"Telegram API error: chat not found"**
→ Envie uma mensagem para o bot antes de rodar o agente (o Telegram precisa de uma mensagem inicial).

**Sem dados sendo coletados**
→ Verifique se o Property ID está no formato `properties/XXXXXXXXX` (com o prefixo).
