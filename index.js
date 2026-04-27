// index.js — ponto de entrada do agente
// Inicia o agendador (cron) + listener do Telegram simultaneamente

import { createServer } from 'node:http';
import cron from 'node-cron';
import { runAnalyticsReport } from './analytics.js';
import { generateSummary } from './summarizer.js';
import { sendToTelegram } from './telegram.js';
import { startListener, stopListener } from './listener.js';
import { SITES } from './config.js';

const HOST = '0.0.0.0';
const PORT = process.env.PORT || 10000;

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

function startHealthServer() {
  const server = createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }

    if (req.method === 'GET' && req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Analytics Agent running');
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  });

  server.listen(PORT, HOST, () => {
    console.log(`Health server listening on ${HOST}:${PORT}`);
  });

  return server;
}

// Cron: a cada hora entre 09h e 20h (horário de Brasília)
const cronTask = cron.schedule('0 9-20 * * *', runJob, {
  timezone: 'America/Sao_Paulo',
});

// Servidor HTTP mínimo para health check do Render Web Service
const healthServer = startHealthServer();

// Listener do Telegram — responde a /report, /status, /help
startListener();

function shutdown(signal) {
  console.log(`${signal} recebido. Encerrando agente...`);
  cronTask.stop();
  stopListener();

  const timeout = setTimeout(() => {
    process.exit(0);
  }, 5000);

  healthServer.close(() => {
    clearTimeout(timeout);
    process.exit(0);
  });
}

process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));

console.log('Agente iniciado.');
console.log('  → Cron ativo: execução automática às 09h–20h, a cada hora');
console.log('  → Listener ativo: envie /report no Telegram para disparar manualmente');
