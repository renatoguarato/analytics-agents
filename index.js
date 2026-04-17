// index.js — ponto de entrada do agente
// Inicia o agendador e roda o job imediatamente ao subir (opcional)

import cron from 'node-cron';
import { runAnalyticsReport } from './analytics.js';
import { generateSummary } from './summarizer.js';
import { sendToTelegram } from './telegram.js';
import { SITES } from './config.js';

async function runJob() {
  console.log(`\n[${new Date().toLocaleTimeString('pt-BR')}] Iniciando coleta...`);

  for (const site of SITES) {
    try {
      console.log(`  → Coletando dados de: ${site.name}`);

      // 1. Busca métricas no Google Analytics
      const metrics = await runAnalyticsReport(site);

      // 2. Gera resumo via Claude
      const summary = await generateSummary(site.name, metrics);

      // 3. Envia para o Telegram
      await sendToTelegram(summary);

      console.log(`  ✓ ${site.name} concluído`);
    } catch (err) {
      console.error(`  ✗ Erro em ${site.name}:`, err.message);

      // Notifica erro no Telegram para não ficar no escuro
      await sendToTelegram(`⚠️ Erro ao processar *${site.name}*: ${err.message}`).catch(() => {});
    }
  }
}

// Roda a cada hora entre 09h e 20h (horário de Brasília / America/Sao_Paulo)
// Cron: "minuto hora dia mês dia-da-semana"
// "0 9-20 * * *" = no minuto 0 de cada hora, das 9h às 20h
cron.schedule('0 9-20 * * *', runJob, {
  timezone: 'America/Sao_Paulo',
});

console.log('Agente iniciado. Aguardando próxima execução (09h–20h, a cada hora)...');

// Descomente a linha abaixo para rodar imediatamente ao iniciar o processo:
// runJob();
