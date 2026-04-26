// listener.js — escuta mensagens do Telegram (texto e áudio) e dispara jobs
// Áudio: baixa o arquivo → transcreve com Groq → interpreta com Groq → executa

import { createWriteStream, createReadStream } from 'fs';
import { unlink } from 'fs/promises';
import { pipeline } from 'stream/promises';
import Groq from 'groq-sdk';
import { runAnalyticsReport } from './analytics.js';
import { generateSummary } from './summarizer.js';
import { sendToTelegram } from './telegram.js';
import { SITES } from './config.js';

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ALLOWED_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

let groq;

function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY não definida no .env');
  }

  if (!groq) {
    groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  return groq;
}

let offset = 0;

const COMMANDS = {
  '/report': handleReport,
  '/status': handleStatus,
  '/help':   handleHelp,
};

export function startListener() {
  console.log('Listener Telegram ativo (texto + áudio). Envie /report ou um áudio no chat.');
  poll();
}

// ─── Loop de polling ────────────────────────────────────────────────────────

async function poll() {
  while (true) {
    try {
      const updates = await getUpdates();
      for (const update of updates) {
        offset = update.update_id + 1;
        await handleUpdate(update);
      }
    } catch (err) {
      console.error('Erro no polling:', err.message);
      await sleep(5000);
    }
  }
}

async function getUpdates() {
  const url = `https://api.telegram.org/bot${TOKEN}/getUpdates?offset=${offset}&timeout=30`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.ok) return [];
  return data.result || [];
}

// ─── Roteador principal ─────────────────────────────────────────────────────

async function handleUpdate(update) {
  const message = update.message;
  if (!message) return;

  if (String(message.chat.id) !== String(ALLOWED_CHAT_ID)) return;

  if (message.voice || message.audio) {
    await handleAudio(message);
    return;
  }

  if (message.text) {
    await handleText(message);
  }
}

// ─── Handler: texto ─────────────────────────────────────────────────────────

async function handleText(message) {
  const text = message.text.trim();
  console.log(`[Telegram] Texto: ${text}`);

  const command = text.split(' ')[0].toLowerCase();
  const handler = COMMANDS[command];

  if (handler) {
    await handler();
  } else {
    await sendToTelegram(`Comando não reconhecido: *${command}*\nEnvie /help para ver as opções.`);
  }
}

// ─── Handler: áudio ─────────────────────────────────────────────────────────

async function handleAudio(message) {
  const fileInfo = message.voice || message.audio;
  console.log(`[Telegram] Áudio recebido (${fileInfo.duration}s)`);

  await sendToTelegram('🎙️ Áudio recebido, transcrevendo...');

  const tmpPath = `/tmp/audio_${Date.now()}.ogg`;

  try {
    // 1. Baixa o arquivo de áudio do Telegram
    await downloadTelegramFile(fileInfo.file_id, tmpPath);

    // 2. Transcreve com Groq
    const transcription = await transcribeAudio(tmpPath);
    console.log(`[Groq] Transcrição: "${transcription}"`);
    await sendToTelegram(`📝 _"${transcription}"_`);

    // 3. Interpreta intenção com Groq e executa
    await interpretAndExecute(transcription);

  } catch (err) {
    console.error('Erro ao processar áudio:', err.message);
    await sendToTelegram(`⚠️ Não consegui processar o áudio: ${err.message}`);
  } finally {
    await unlink(tmpPath).catch(() => {});
  }
}

// ─── Transcrição via Groq ───────────────────────────────────────────────────

async function downloadTelegramFile(fileId, destPath) {
  const infoRes = await fetch(`https://api.telegram.org/bot${TOKEN}/getFile?file_id=${fileId}`);
  const info = await infoRes.json();
  if (!info.ok) throw new Error('Não foi possível obter o arquivo do Telegram');

  const fileUrl = `https://api.telegram.org/file/bot${TOKEN}/${info.result.file_path}`;
  const res = await fetch(fileUrl);
  if (!res.ok) throw new Error('Falha ao baixar o áudio');
  await pipeline(res.body, createWriteStream(destPath));
}

async function transcribeAudio(filePath) {
  const transcription = await getGroqClient().audio.transcriptions.create({
    file: createReadStream(filePath),
    model: 'whisper-large-v3-turbo',
    language: 'pt',
  });
  return transcription.text.trim();
}

// ─── Groq: interpreta intenção e executa ─────────────────────────────────────

async function interpretAndExecute(transcription) {
  const sitesInfo = SITES.map(s => `- "${s.name}"`).join('\n');

  const response = await getGroqClient().chat.completions.create({
    model: 'llama-3.1-8b-instant',
    max_tokens: 200,
    response_format: { type: 'json_object' },
    messages: [{
      role: 'user',
      content: `Você é o interpretador de comandos de um agente de analytics.
O usuário disse (por áudio): "${transcription}"

Sites disponíveis:
${sitesInfo}

Responda APENAS com um JSON válido, sem texto adicional:
{
  "action": "report" | "report_site" | "status" | "help" | "unknown",
  "site": "nome exato do site ou null",
  "confidence": 0.0 a 1.0
}

Exemplos:
- "me manda o relatório" → {"action":"report","site":null,"confidence":0.95}
- "como está o CRM imobiliário" → {"action":"report_site","site":"CRM Imobiliário","confidence":0.9}
- "o bot tá funcionando?" → {"action":"status","site":null,"confidence":0.95}`,
    }],
  });

  let intent;
  try {
    intent = JSON.parse(response.choices[0]?.message?.content?.trim() || '{}');
  } catch {
    await sendToTelegram('⚠️ Não entendi o comando. Tente: _"me manda o relatório"_ ou _"como está o site X"_');
    return;
  }

  console.log(`[Groq] Intenção detectada:`, intent);

  if (intent.confidence < 0.6) {
    await sendToTelegram('🤔 Não entendi bem. Envie /help para ver os comandos disponíveis.');
    return;
  }

  switch (intent.action) {
    case 'report':
      await handleReport();
      break;

    case 'report_site': {
      const site = SITES.find(s => s.name === intent.site);
      if (!site) {
        await sendToTelegram(`⚠️ Site *"${intent.site}"* não encontrado.\nSites disponíveis:\n${SITES.map(s => `• ${s.name}`).join('\n')}`);
        return;
      }
      await sendToTelegram(`🔍 Coletando dados de *${site.name}*...`);
      const metrics = await runAnalyticsReport(site);
      const summary = await generateSummary(site.name, metrics);
      await sendToTelegram(summary);
      break;
    }

    case 'status':
      await handleStatus();
      break;

    case 'help':
      await handleHelp();
      break;

    default:
      await sendToTelegram('🤔 Não entendi. Tente dizer _"me manda o relatório"_ ou envie /help.');
  }
}

// ─── Handlers de comandos ────────────────────────────────────────────────────

async function handleReport() {
  const sitesMsg = SITES.map(s => `• ${s.name}`).join('\n');
  await sendToTelegram(`🔍 Coletando dados de ${SITES.length} site(s)...\n${sitesMsg}`);

  for (const site of SITES) {
    try {
      const metrics = await runAnalyticsReport(site);
      const summary = await generateSummary(site.name, metrics);
      await sendToTelegram(summary);
    } catch (err) {
      await sendToTelegram(`⚠️ Erro em *${site.name}*: ${err.message}`);
    }
  }

  await sendToTelegram('✅ Relatório concluído.');
}

async function handleStatus() {
  const hora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  await sendToTelegram(`🟢 Bot online\n🕐 ${hora}\n📌 ${SITES.length} site(s) configurado(s)`);
}

async function handleHelp() {
  await sendToTelegram(
    `*Comandos disponíveis:*\n\n` +
    `📊 /report — Relatório de todos os sites agora\n` +
    `🟢 /status — Verifica se o bot está online\n` +
    `❓ /help — Esta mensagem\n\n` +
    `🎙️ *Você também pode enviar um áudio:*\n` +
    `_"me manda o relatório"_\n` +
    `_"como está o CRM imobiliário?"_`
  );
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
