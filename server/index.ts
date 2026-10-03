import 'dotenv/config';
import express from 'express';
import cron from 'node-cron';
import fs from 'fs';
import { randomUUID } from 'crypto';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import { removeClientStoredSecrets } from '../state/snapshotSecurity';
import { initializeDatabase, isDatabaseConfigured, query, getDatabaseStatus, getRecentCronLogs, writeCronLog, saveUserAppStateSnapshot, loadUserAppStateSnapshot } from './db';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

async function startServer() {
  const app = express();
  const port = process.env.PORT || 3000;
  const isProduction = process.env.NODE_ENV === 'production';
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
  const authClient = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
      })
    : null;

  await initializeDatabase();

  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    next();
  });
  app.use(express.json({ limit: '20mb' }));
  app.use('/uploads', (req, res, next) => {
    if (isProduction) {
      return res.status(503).json({ status: 'unavailable', message: 'File serving is disabled until private object storage is configured.' });
    }
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
    next();
  });
  app.use('/uploads', express.static(uploadsDir));

  const requireAuthenticatedUser: express.RequestHandler = (req, res, next) => {
    const remoteAddress = req.socket.remoteAddress || '';
    const isLoopback = remoteAddress === '::1'
      || remoteAddress === '127.0.0.1'
      || remoteAddress.startsWith('127.')
      || remoteAddress.startsWith('::ffff:127.');

    if (!authClient) {
      if (isProduction) {
        return res.status(503).json({
          status: 'unavailable',
          message: 'Protected APIs require Supabase authentication to be configured.',
        });
      }
      if (!isLoopback) {
        return res.status(403).json({ status: 'error', message: 'This endpoint is only available from the local development machine.' });
      }
      res.locals.ownerId = 'local-development';
      return next();
    }

    const authorization = req.header('authorization') || '';
    const bearerMatch = /^Bearer ([^\s]+)$/.exec(authorization);
    if (!bearerMatch) {
      return res.status(401).json({ status: 'error', message: 'A valid sign-in session is required.' });
    }

    authClient.auth.getUser(bearerMatch[1]).then(({ data, error }) => {
      if (error || !data.user) {
        return res.status(401).json({ status: 'error', message: 'The sign-in session is invalid or expired.' });
      }
      res.locals.ownerId = data.user.id;
      return next();
    }).catch((error: unknown) => {
      console.error('Supabase session verification failed:', error);
      return res.status(503).json({ status: 'error', message: 'Could not verify the sign-in session.' });
    });
  };

  const validateOwnerId = (res: express.Response) => {
    const ownerId = res.locals.ownerId;
    if (typeof ownerId !== 'string' || !ownerId) {
      throw new Error('Authenticated owner identity was not established.');
    }
    return ownerId;
  };

  app.use(['/api/app-state', '/api/media/upload', '/api/mailchimp/campaign', '/api/system-status', '/api/ai'], requireAuthenticatedUser);

  app.post('/api/media/upload', async (req, res) => {
    try {
      validateOwnerId(res);
      if (isProduction) {
      return res.status(503).json({
        status: 'unavailable',
        message: 'File uploads remain disabled until tenant-scoped durable object storage is configured.',
      });
      }
      const { fileName, dataUrl } = req.body || {};
      if (!fileName || !dataUrl || typeof dataUrl !== 'string') {
        return res.status(400).json({ status: 'error', message: 'A file name and base64 payload are required.' });
      }

      const match = /^data:([^;]+);base64,(.*)$/.exec(dataUrl);
      if (!match || !match[2]) {
        return res.status(400).json({ status: 'error', message: 'A non-empty base64 data URL is required.' });
      }

      const contentType = match[1].toLowerCase();
      const maxUploadBytes = 10 * 1024 * 1024;
      if (match[2].length > Math.ceil(maxUploadBytes / 3) * 4) {
        return res.status(413).json({ status: 'error', message: 'Files must be 10 MB or smaller.' });
      }

      if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(match[2])) {
        return res.status(400).json({ status: 'error', message: 'The file payload is not valid base64.' });
      }

      const buffer = Buffer.from(match[2], 'base64');
      if (buffer.length === 0 || buffer.length > maxUploadBytes) {
        return res.status(413).json({ status: 'error', message: 'Files must be between 1 byte and 10 MB.' });
      }

      const extension = path.extname(String(fileName)).toLowerCase();
      const extensionTypes: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.mp4': 'video/mp4',
        '.mov': 'video/quicktime',
        '.mp3': 'audio/mpeg',
        '.m4a': 'audio/mp4',
        '.wav': 'audio/wav',
        '.ogg': 'audio/ogg',
        '.pdf': 'application/pdf',
        '.txt': 'text/plain',
        '.csv': 'text/csv',
        '.zip': 'application/zip',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
      if (!extensionTypes[extension] || extensionTypes[extension] !== contentType) {
        return res.status(415).json({ status: 'error', message: 'The file extension and content type must match a supported format.' });
      }

      const filePath = path.join(uploadsDir, `${randomUUID()}${extension}`);
      await fs.promises.writeFile(filePath, buffer, { flag: 'wx' });

      res.json({
        status: 'ok',
        storageMode: 'server-local',
        path: `/uploads/${path.basename(filePath)}`,
        contentType,
        sizeBytes: buffer.length,
      });
    } catch (error: any) {
      console.error('Local media upload failed:', error);
      res.status(500).json({ status: 'error', message: error?.message || 'Local file upload failed.' });
    }
  });

  if (!isProduction && process.env.ENABLE_CRON_LOGS === 'true' && isDatabaseConfigured) {
    cron.schedule('* * * * *', async () => {
    console.log('Running scheduled task: Logging to Neon...');
    try {
      await writeCronLog({
        timestamp: new Date().toISOString(),
        status: 'success',
        message: 'Cron job executed successfully',
        serverTime: new Date().toISOString(),
        details: {
          source: 'neon-postgres',
          environment: process.env.NODE_ENV || 'development',
        },
      });
      console.log('Cron job log saved to Neon');
    } catch (error: any) {
      console.error('Cron job failed:', error);
      try {
        await writeCronLog({
          timestamp: new Date().toISOString(),
          status: 'failure',
          message: error?.message || 'Cron job failed',
          serverTime: new Date().toISOString(),
          details: {
            source: 'neon-postgres',
            error: error?.message || String(error),
          },
        });
      } catch (writeError) {
        console.error('Failed to write cron failure log:', writeError);
      }
    }
    });
  }

  app.get('/api/config', (req, res) => {
    res.json({
      database: {
        ...getDatabaseStatus(),
        configured: isDatabaseConfigured && Boolean(authClient),
      },
      ai: {
        providers: ['OpenRouter', 'Groq', 'MiniMax', 'Google Gemini'],
        configured: Boolean(
          process.env.OPENROUTER_API_KEY ||
          process.env.GROQ_API_KEY ||
          process.env.MINIMAX_API_KEY ||
          process.env.GEMINI_API_KEY
        )
      }
    });
  });

  app.post('/api/ai/chat', async (req, res) => {
    if (isProduction) {
      return res.status(503).json({ status: 'unavailable', message: 'AI requests are disabled in production until quotas and privacy controls are configured.' });
    }
    const { messages, jsonMode } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 30
      || messages.some((message) => !message || !['system', 'user', 'assistant'].includes(message.role)
        || typeof message.content !== 'string' || message.content.length > 12000)
      || messages.reduce((total, message) => total + message.content.length, 0) > 40000
      || (jsonMode !== undefined && typeof jsonMode !== 'boolean')) {
      return res.status(400).json({ status: 'error', message: 'Provide 1–30 valid messages with no more than 40,000 characters total.' });
    }

    const chatProviders = [
      {
        name: 'OpenRouter',
        key: process.env.OPENROUTER_API_KEY,
        url: 'https://openrouter.ai/api/v1/chat/completions',
        model: 'google/gemini-2.0-flash-exp:free',
      },
      {
        name: 'Groq',
        key: process.env.GROQ_API_KEY,
        url: 'https://api.groq.com/openai/v1/chat/completions',
        model: 'llama-3.3-70b-versatile',
      },
      {
        name: 'MiniMax',
        key: process.env.MINIMAX_API_KEY,
        url: 'https://api.minimax.chat/v1/text/chatcompletion_v2',
        model: 'abab6.5s-chat',
      },
    ].filter((provider) => Boolean(provider.key));

    if (!chatProviders.length && !process.env.GEMINI_API_KEY) {
      return res.status(503).json({ status: 'unavailable', message: 'No server-side AI provider is configured.' });
    }

    const failures: string[] = [];
    for (const provider of chatProviders) {
      try {
        const response = await fetch(provider.url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${provider.key}`,
            'Content-Type': 'application/json',
            ...(provider.name === 'OpenRouter' ? { 'HTTP-Referer': 'http://localhost', 'X-Title': 'BANDMATE' } : {}),
          },
          body: JSON.stringify({
            model: provider.model,
            messages,
            response_format: jsonMode ? { type: 'json_object' } : undefined,
            temperature: 0.7,
          }),
          signal: AbortSignal.timeout(30000),
        });
        const result = await response.json();
        const content = result?.choices?.[0]?.message?.content;
        if (!response.ok || typeof content !== 'string' || !content) {
          throw new Error(`Provider returned status ${response.status} or no content.`);
        }

        return res.json({
          status: 'ok',
          provider: provider.name,
          content,
          tokensUsed: typeof result.usage?.total_tokens === 'number' ? result.usage.total_tokens : undefined,
        });
      } catch (error) {
        console.error(`${provider.name} chat request failed:`, error);
        failures.push(provider.name);
      }
    }

    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const systemInstruction = messages
          .filter((message) => message.role === 'system')
          .map((message) => message.content)
          .join('\n\n');
        const contents = messages
          .filter((message) => message.role !== 'system')
          .map((message) => ({
            role: message.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: message.content }],
          }));
        const result = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents,
          config: {
            systemInstruction: systemInstruction || undefined,
            responseMimeType: jsonMode ? 'application/json' : 'text/plain',
          },
        });
        if (result.text) {
          return res.json({ status: 'ok', provider: 'Google Gemini', content: result.text });
        }
        throw new Error('Gemini returned no content.');
      } catch (error) {
        console.error('Google Gemini chat request failed:', error);
        failures.push('Google Gemini');
      }
    }

    return res.status(502).json({
      status: 'error',
      message: failures.length ? `AI providers failed: ${failures.join(', ')}.` : 'No AI provider is configured.',
    });
  });

  app.post('/api/ai/image', async (req, res) => {
    if (isProduction) {
      return res.status(503).json({ status: 'unavailable', message: 'Image generation is disabled in production until quotas and privacy controls are configured.' });
    }
    const { prompt } = req.body || {};
    if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 4000) {
      return res.status(400).json({ status: 'error', message: 'Provide an image prompt between 1 and 4,000 characters.' });
    }

    if (process.env.MINIMAX_API_KEY) {
      try {
        const response = await fetch('https://api.minimax.chat/v1/image_generation', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.MINIMAX_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'minimax-v2-image-generation',
            prompt,
            response_format: 'base64',
          }),
          signal: AbortSignal.timeout(60000),
        });
        const result = await response.json();
        const image = result?.data?.[0]?.b64_json || result?.images?.[0]?.url;
        if (response.ok && typeof image === 'string') {
          return res.json({
            status: 'ok',
            provider: 'MiniMax',
            image: image.startsWith('data:') ? image : `data:image/png;base64,${image}`,
          });
        }
        throw new Error(`MiniMax returned status ${response.status} or no image.`);
      } catch (error) {
        console.error('MiniMax image request failed:', error);
      }
    }

    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const result = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: { responseModalities: ['TEXT', 'IMAGE'] },
        });
        const imagePart = result.candidates?.[0]?.content?.parts?.find((part) => part.inlineData);
        if (imagePart?.inlineData?.data) {
          const mimeType = imagePart.inlineData.mimeType || 'image/png';
          return res.json({
            status: 'ok',
            provider: 'Google Gemini',
            image: `data:${mimeType};base64,${imagePart.inlineData.data}`,
          });
        }
        throw new Error('Gemini returned no image data.');
      } catch (error) {
        console.error('Google Gemini image request failed:', error);
      }
    }

    return res.status(502).json({
      status: 'error',
      message: 'Image generation failed or no server-side image provider is configured.',
    });
  });

  app.get('/api/system-status', async (req, res) => {
    validateOwnerId(res);
    if (isProduction) {
      return res.status(503).json({ status: 'unavailable', message: 'Production monitoring is not configured.' });
    }
    if (!isDatabaseConfigured) {
      return res.status(503).json({
        status: 'degraded',
        message: 'Database not configured. Add DATABASE_URL or DB_* vars to enable persistence.',
        dbConfigured: false,
        logs: []
      });
    }

    try {
      const logs = await getRecentCronLogs(10);
      res.json({
        status: 'online',
        dbConfigured: true,
        logs,
      });
    } catch (error: any) {
      console.error('Failed to load system status logs:', error);
      res.status(500).json({
        status: 'error',
        dbConfigured: true,
        logs: [],
        error: error.message,
      });
    }
  });

  app.get('/api/app-state', async (req, res) => {
    if (!isDatabaseConfigured) {
      return res.status(503).json({
        status: 'degraded',
        message: 'Database not configured. Add DATABASE_URL or DB_* vars to enable persistence.',
        dbConfigured: false,
        payload: null,
      });
    }

    try {
      const key = String(req.query.key || 'bandmate-app-state');
      if (key.length > 128) {
        return res.status(400).json({ status: 'error', message: 'Snapshot key must be 128 characters or fewer.' });
      }
      const ownerId = validateOwnerId(res);
      const payload = await loadUserAppStateSnapshot(ownerId, key);
      if (!payload) {
        return res.status(404).json({
          status: 'not-found',
          key,
          payload: null,
        });
      }

      res.json({ status: 'ok', key, payload });
    } catch (error: any) {
      console.error('Failed to load app state:', error);
      res.status(500).json({
        status: 'error',
        error: error.message,
      });
    }
  });

  app.post('/api/app-state', async (req, res) => {
    if (!isDatabaseConfigured) {
      return res.status(503).json({
        status: 'degraded',
        message: 'Database not configured. Add DATABASE_URL or DB_* vars to enable persistence.',
        dbConfigured: false,
      });
    }

    try {
      const { key = 'bandmate-app-state', payload } = req.body || {};

      if (typeof key !== 'string' || !key || key.length > 128 || typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
        return res.status(400).json({
          status: 'error',
          message: 'Payload must be an object and include a key.',
        });
      }

      const ownerId = validateOwnerId(res);
      const safePayload = removeClientStoredSecrets(payload as Record<string, unknown>);
      const saved = await saveUserAppStateSnapshot(ownerId, key, safePayload);
      res.json({ status: 'ok', key, payload: saved?.payload ?? payload });
    } catch (error: any) {
      console.error('Failed to save app state:', error);
      res.status(500).json({
        status: 'error',
        error: error.message,
      });
    }
  });

  app.post('/api/mailchimp/campaign', async (req, res) => {
    if (isProduction) {
      return res.status(503).json({ status: 'unavailable', message: 'Campaign delivery is disabled until provider credentials and recipient consent are managed securely.' });
    }
    try {
      const { apiKey, serverPrefix, listId, title, subject, fromName, replyTo, html } = req.body || {};
      if (!apiKey || !serverPrefix || !listId || !subject || !html) {
        return res.status(400).json({
          status: 'error',
          message: 'Mailchimp API key, server prefix, list ID, subject and HTML content are required.',
        });
      }

      const normalizedServer = String(serverPrefix).trim().replace(/^https?:\/\//, '').replace(/\.api\.mailchimp\.com$/, '');
      const response = await fetch(`https://${normalizedServer}.api.mailchimp.com/3.0/campaigns`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`any:${apiKey}`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'regular',
          recipients: { list_id: listId },
          settings: {
            subject_line: subject,
            title: title || subject,
            from_name: fromName || 'BandMate',
            reply_to: replyTo || 'hello@example.com',
            auto_footer: false,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(502).json({
          status: 'error',
          message: 'Mailchimp rejected the request.',
          details: errorText,
        });
      }

      const campaign = await response.json();
      const contentResponse = await fetch(`https://${normalizedServer}.api.mailchimp.com/3.0/campaigns/${campaign.id}/content`, {
        method: 'PUT',
        headers: {
          'Authorization': `Basic ${Buffer.from(`any:${apiKey}`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ html }),
      });

      if (!contentResponse.ok) {
        const contentText = await contentResponse.text();
        return res.status(502).json({
          status: 'error',
          message: 'Mailchimp content upload failed.',
          details: contentText,
        });
      }

      res.json({ status: 'ok', campaignId: campaign.id, message: 'Campaign created in Mailchimp.' });
    } catch (error: any) {
      console.error('Mailchimp request failed:', error);
      res.status(500).json({ status: 'error', message: error.message || 'Unexpected Mailchimp failure.' });
    }
  });

  app.get('/api/health', async (req, res) => {
    if (!isDatabaseConfigured || (isProduction && !authClient)) {
      return res.status(503).json({
        status: 'degraded',
        message: !authClient && isProduction
          ? 'Production health is degraded until Supabase authentication is configured.'
          : 'Database not configured. Add DATABASE_URL or DB_* vars to enable persistence.',
        dbConfigured: isDatabaseConfigured
      });
    }

    try {
      const result = await query('SELECT NOW()');
      res.json({ 
          status: 'online', 
          message: 'Database connected', 
          dbConfigured: true,
          dbTime: result.rows[0].now 
      });
    } catch (error: any) {
      console.error('Database connection error:', error);
      res.status(500).json({ 
          status: 'error', 
          message: 'Database health check failed.',
          dbConfigured: true
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('/{*path}', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const host = isProduction ? '0.0.0.0' : '127.0.0.1';
  app.listen(Number(port), host, () => {
    console.log(`Backend server running at http://${host}:${port}`);
    console.log(`Database status: ${isDatabaseConfigured ? 'configured' : 'not configured'}`);
  });
}

startServer();
