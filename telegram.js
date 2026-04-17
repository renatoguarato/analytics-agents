// telegram.js — envia mensagens para o seu Telegram via Bot API

/**
 * Envia uma mensagem de texto para o chat configurado no .env.
 * @param {string} text - Texto da mensagem (suporta Markdown do Telegram)
 */
export async function sendToTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    throw new Error('TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID não configurados no .env');
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  const body = {
    chat_id: chatId,
    text,
    parse_mode: 'Markdown',          // permite *negrito*, _itálico_ etc.
    disable_web_page_preview: true,  // evita preview de links na mensagem
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const result = await response.json();

  if (!result.ok) {
    throw new Error(`Telegram API error: ${result.description}`);
  }

  return result;
}
