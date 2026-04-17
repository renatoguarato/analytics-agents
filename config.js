// config.js — configuração centralizada dos seus sites
// Edite a lista SITES com os dados de cada propriedade do Google Analytics

import 'dotenv/config';

// Lista de sites que o agente vai monitorar
// propertyId: o ID numérico da propriedade GA4 (ex: "properties/123456789")
// Encontre em: analytics.google.com → Admin → Property Settings → Property ID
export const SITES = [
  {
    name: 'Meu Site Principal',       // nome amigável para aparecer no resumo
    propertyId: 'properties/XXXXXXXX', // substitua pelo ID real
  },
  {
    name: 'CRM Imobiliário',
    propertyId: 'properties/YYYYYYYY',
  },
  // Adicione mais sites aqui conforme necessário
];

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
if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.warn('⚠️  TELEGRAM_BOT_TOKEN não definida no .env');
}
if (!process.env.TELEGRAM_CHAT_ID) {
  console.warn('⚠️  TELEGRAM_CHAT_ID não definida no .env');
}
