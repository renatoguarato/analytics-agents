// index.js — ponto de entrada do agente
// Inicia o agendador (cron) + listener do Telegram simultaneamente

import cron from 'node-cron';
import { runAnalyticsReport } from './analytics.js';
import { generateSummary } from './summarizer.js';
import { sendToTelegram } from './telegram.js';
import { startListener } from './listener.js';
import { SITES } from './config.js';

export async function runJob() {
  console.log(`\n[${new Date().toLocaleTimeString('pt-BR')}] Iniciando coleta...`);

  for (const site of SITES) {
    try {
      console.log(`  → Coletando dados de: ${site.name}`);
      const metrics = await runAnalyticsReport(site);
      const summary = await generateSummary(site.name, metrics);
      await sendToTelegram(summary);
      console.log(`  ✓ ${site.name} concluído`);
    } catch (err) {
      console.error(`  ✗ Erro em ${site.name}:`, err.message);
      await sendToTelegram(`⚠️ Erro ao processar *${site.name}*: ${err.message}`).catch(() => {});
    }
  }
}

// Cron: a cada hora entre 09h e 20h (horário de Brasília)
cron.schedule('0 9-20 * * *', runJob, {
  timezone: 'America/Sao_Paulo',
});

// Listener do Telegram — responde a /report, /status, /help
startListener();

console.log('Agente iniciado.');
console.log('  → Cron ativo: execução automática às 09h–20h, a cada hora');
console.log('  → Listener ativo: envie /report no Telegram para disparar manualmente');
