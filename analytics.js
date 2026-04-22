// analytics.js — coleta métricas do Google Analytics 4 Data API
// Documentação: https://developers.google.com/analytics/devguides/reporting/data/v1

import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { METRICS, DIMENSIONS, DATE_RANGE } from './config.js';

// O cliente usa a chave de serviço definida em GOOGLE_APPLICATION_CREDENTIALS
const analyticsClient = new BetaAnalyticsDataClient();

/**
 * Busca as métricas de um site no Google Analytics.
 * @param {Object} site - Objeto com { name, propertyId }
 * @returns {Object} Métricas formatadas prontas para o summarizer
 */
export async function runAnalyticsReport(site) {
  const [response] = await analyticsClient.runReport({
    property: site.propertyId,
    dateRanges: [DATE_RANGE],
    metrics: METRICS,
    dimensions: DIMENSIONS.length > 0 ? DIMENSIONS : undefined,
  });

  // Se não houver dados (site sem visitas no período), retorna zeros
  if (!response.rows || response.rows.length === 0) {
    return buildEmptyMetrics(site.name);
  }

  // Monta um objeto legível para passar ao summarizer
  return formatMetrics(response, site.name);
}

/**
 * Converte a resposta bruta da API em um objeto simples { chave: valor }.
 */
function formatMetrics(response, siteName) {
  const metricHeaders = response.metricHeaders.map(h => h.name);
  const dimensionHeaders = response.dimensionHeaders?.map(h => h.name) || [];

  // Agrega totais (quando há dimensões, somamos ou tiramos média)
  const totals = {};
  metricHeaders.forEach(metric => { totals[metric] = 0; });

  let rowCount = 0;
  for (const row of response.rows) {
    rowCount++;
    row.metricValues.forEach((val, i) => {
      const metricName = metricHeaders[i];
      // bounceRate e averageSessionDuration → média; restante → soma
      totals[metricName] += parseFloat(val.value) || 0;
    });
  }

  // Calcula médias para métricas de taxa/duração
  const rateMetrics = ['bounceRate', 'averageSessionDuration'];
  rateMetrics.forEach(m => {
    if (totals[m] !== undefined && rowCount > 1) {
      totals[m] = totals[m] / rowCount;
    }
  });

  // Formata para leitura humana
  return {
    site: siteName,
    periodo: `${DATE_RANGE.startDate} → ${DATE_RANGE.endDate}`,
    horaColeta: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
    usuariosAtivos: Math.round(totals.activeUsers || 0),
    sesssoes: Math.round(totals.sessions || 0),
    paginasVisualizadas: Math.round(totals.screenPageViews || 0),
    novosUsuarios: Math.round(totals.newUsers || 0),
    taxaRejeicao: ((totals.bounceRate || 0) * 100).toFixed(1) + '%',
    duracaoMediaSessao: formatDuration(totals.averageSessionDuration || 0),
  };
}

function buildEmptyMetrics(siteName) {
  return {
    site: siteName,
    periodo: `${DATE_RANGE.startDate} → ${DATE_RANGE.endDate}`,
    horaColeta: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
    usuariosAtivos: 0,
    sesssoes: 0,
    paginasVisualizadas: 0,
    novosUsuarios: 0,
    taxaRejeicao: '0%',
    duracaoMediaSessao: '0s',
    aviso: 'Nenhuma visita registrada no período',
  };
}

function formatDuration(seconds) {
  const s = Math.round(seconds);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}m ${rem}s`;
}
