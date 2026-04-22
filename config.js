// config.js — configuração centralizada do agente
// Configure os sites no .env usando a variável GA_SITES

import 'dotenv/config';

function parseSites() {
  if (!process.env.GA_SITES) {
    console.warn('⚠️  GA_SITES não definida no .env');
    return [];
  }

  let sites;
  try {
    sites = JSON.parse(process.env.GA_SITES);
  } catch {
    throw new Error('GA_SITES deve ser um JSON válido. Ex: [{"name":"Meu Site","propertyId":"properties/123456789"}]');
  }

  if (!Array.isArray(sites)) {
    throw new Error('GA_SITES deve ser uma lista JSON de sites.');
  }

  for (const site of sites) {
    if (!site.name || !site.propertyId) {
      throw new Error('Cada item de GA_SITES deve ter "name" e "propertyId".');
    }
  }

  return sites;
}

// Lista de sites que o agente vai monitorar.
// propertyId: use o formato "properties/123456789".
export const SITES = parseSites();

// Métricas coletadas por site (referência GA4 Data API)
// Você pode adicionar ou remover métricas desta lista
export const METRICS = [
  { name: 'activeUsers' },          // usuários ativos no período
  { name: 'sessions' },             // sessões
  { name: 'screenPageViews' },      // páginas visualizadas
  { name: 'bounceRate' },           // taxa de rejeição
  { name: 'averageSessionDuration' },// duração média da sessão (segundos)
  { name: 'newUsers' },             // novos usuários
];

// Dimensões opcionais (descomente se quiser mais detalhes)
export const DIMENSIONS = [
  // { name: 'country' },           // país de origem
  // { name: 'deviceCategory' },    // mobile / desktop / tablet
  // { name: 'sessionSource' },     // origem do tráfego
];

// Período de coleta: 'today' para dados do dia atual
// Outros exemplos: 'yesterday', '7daysAgo', '30daysAgo'
export const DATE_RANGE = {
  startDate: 'today',
  endDate: 'today',
};

// Validação básica no startup
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.warn('⚠️  GOOGLE_APPLICATION_CREDENTIALS não definida no .env');
}
if (!process.env.GROQ_API_KEY) {
  console.warn('⚠️  GROQ_API_KEY não definida no .env');
}
if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.warn('⚠️  TELEGRAM_BOT_TOKEN não definida no .env');
}
if (!process.env.TELEGRAM_CHAT_ID) {
  console.warn('⚠️  TELEGRAM_CHAT_ID não definida no .env');
}
