import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { IncomingMessage, ServerResponse } from 'http'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'recipe-fetch-proxy',
      configureServer(server) {
        server.middlewares.use('/api/fetch-recipe', async (req: IncomingMessage, res: ServerResponse) => {
          const url = new URL(req.url || '', 'http://localhost').searchParams.get('url');
          if (!url) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Missing url parameter' }));
            return;
          }
          try {
            const response = await fetch(url, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; MealPlan/1.0)',
                'Accept': 'text/html,application/xhtml+xml',
              },
            });
            if (!response.ok) {
              res.statusCode = response.status;
              res.end(JSON.stringify({ error: `Failed to fetch: ${response.status}` }));
              return;
            }
            const html = await response.text();
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ contents: html }));
          } catch (err) {
            res.statusCode = 502;
            res.end(JSON.stringify({ error: String(err) }));
          }
        });
      },
    },
    {
      name: 'ai-proxy',
      configureServer(server) {
        server.middlewares.use('/api/ai/anthropic', async (req: IncomingMessage, res: ServerResponse) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
          }

          const chunks: Buffer[] = [];
          for await (const chunk of req) {
            chunks.push(chunk as Buffer);
          }
          const body = JSON.parse(Buffer.concat(chunks).toString());

          const { apiKey, model, maxTokens, messages, system } = body;
          if (!apiKey) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Missing apiKey' }));
            return;
          }

          try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
              },
              body: JSON.stringify({
                model: model || 'claude-haiku-4-5-20251001',
                max_tokens: maxTokens || 2048,
                messages,
                ...(system ? { system } : {}),
              }),
            });

            const data = await response.text();
            res.statusCode = response.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(data);
          } catch (err) {
            res.statusCode = 502;
            res.end(JSON.stringify({ error: String(err) }));
          }
        });
      },
    },
    {
      name: 'embeddings-proxy',
      configureServer(server) {
        server.middlewares.use('/api/ai/embeddings', async (req: IncomingMessage, res: ServerResponse) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
          }

          const chunks: Buffer[] = [];
          for await (const chunk of req) {
            chunks.push(chunk as Buffer);
          }
          const body = JSON.parse(Buffer.concat(chunks).toString());

          const { apiKey, input, model } = body;
          if (!apiKey) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Missing apiKey' }));
            return;
          }

          try {
            const response = await fetch('https://api.openai.com/v1/embeddings', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                model: model || 'text-embedding-3-small',
                input,
              }),
            });

            const data = await response.text();
            res.statusCode = response.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(data);
          } catch (err) {
            res.statusCode = 502;
            res.end(JSON.stringify({ error: String(err) }));
          }
        });
      },
    },
  ],
})
