import { config } from 'dotenv';
import { generateText } from 'ai';

config({ path: '.env.local' });

if (!process.env.AI_GATEWAY_API_KEY) {
  throw new Error('Set AI_GATEWAY_API_KEY in .env.local before running this example.');
}

const { text } = await generateText({
  model: 'moonshotai/kimi-k3',
  prompt: 'Invent a new holiday and describe its traditions.',
});

if (!text.trim()) {
  throw new Error('The model returned no text.');
}

console.log(text);
