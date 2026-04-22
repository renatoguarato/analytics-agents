// summarizer.js — gera resumo inteligente dos dados via Groq
// O modelo analisa os números e escreve um parágrafo com insights relevantes

import Groq from 'groq-sdk';

let client;

function getClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY não definida no .env');
  }

  if (!client) {
    client = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  return client;
}

/**
 * Gera um resumo em linguagem natural a partir das métricas coletadas.
 * @param {string} siteName - Nome do site
 * @param {Object} metrics - Objeto com as métricas formatadas
 * @returns {string} Mensagem formatada para enviar ao Telegram
 */
export async function generateSummary(siteName, metrics) {
  const prompt = `
Você é um analista de dados web conciso e direto. Analise as métricas abaixo e gere um resumo curto para envio no Telegram.

MÉTRICAS COLETADAS:
${JSON.stringify(metrics, null, 2)}

INSTRUÇÕES:
- Escreva em português
- Use emoji para deixar a mensagem visual e fácil de ler
- Destaque pontos positivos e alertas se houver
- Seja conciso: no máximo 5–7 linhas
- Use formatação Markdown do Telegram (negrito com *texto*, itálico com _texto_)
- Não use headers ou listas longas — seja direto
- Se houver anomalia (ex: bounce rate muito alta, zero sessões), mencione como alerta

Formato esperado da mensagem:
📊 *[Nome do site]* — HH:mm
Linha com principais números
Linha com insight ou observação
[linha de alerta se houver problema]
`;

  const response = await getClient().chat.completions.create({
    model: 'llama-3.1-8b-instant',
    max_tokens: 400,
    messages: [
      { role: 'user', content: prompt },
    ],
  });

  return response.choices[0]?.message?.content?.trim() || '';
}
