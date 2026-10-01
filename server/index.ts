import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import fs from 'fs';
import { initializeDatabase, isDatabaseConfigured, query, getDatabaseStatus, getRecentCronLogs, writeCronLog, saveAppStateSnapshot, loadAppStateSnapshot } from './db';
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

  await initializeDatabase();

  app.use(cors());
  app.use(express.json({ limit: '20mb' }));
  app.use('/uploads', express.static(uploadsDir));

  app.post('/api/media/upload', async (req, res) => {
    try {
      const { fileName, dataUrl } = req.body || {};
      if (!fileName || !dataUrl || typeof dataUrl !== 'string') {
        return res.status(400).json({ status: 'error', message: 'A file name and base64 payload are required.' });
      }

      const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/.exec(dataUrl);
      if (!match) {
        return res.status(400).json({ status: 'error', message: 'Only base64 image uploads are accepted by the local media storage endpoint.' });
      }

      const contentType = match[1];
      const buffer = Buffer.from(match[2], 'base64');
      const safeName = String(fileName).replace(/[^a-zA-Z0-9_.-]+/g, '_');
      const filePath = path.join(uploadsDir, `${Date.now()}-${safeName}`);
      fs.writeFileSync(filePath, buffer);

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

  app.get('/api/config', (req, res) => {
    res.json({
      database: getDatabaseStatus(),
      ai: {
        providers: ['OpenRouter', 'Groq', 'MiniMax', 'Google Gemini'],
        configured: Boolean(
          process.env.VITE_OPENROUTER_API_KEY ||
          process.env.OPENROUTER_API_KEY ||
          process.env.VITE_GROQ_API_KEY ||
          process.env.GROQ_API_KEY ||
          process.env.VITE_MINIMAX_API_KEY ||
          process.env.MINIMAX_API_KEY ||
          process.env.VITE_GEMINI_API_KEY ||
          process.env.GEMINI_API_KEY
        )
      }
    });
  });

  app.get('/api/system-status', async (req, res) => {
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
      const payload = await loadAppStateSnapshot(key);
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

      if (!key || typeof payload !== 'object' || payload === null) {
        return res.status(400).json({
          status: 'error',
          message: 'Payload must be an object and include a key.',
        });
      }

      const saved = await saveAppStateSnapshot(key, payload as Record<string, unknown>);
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
    if (!isDatabaseConfigured) {
      return res.status(503).json({
        status: 'degraded',
        message: 'Database not configured. Add DATABASE_URL or DB_* vars to enable persistence.',
        dbConfigured: false
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
          message: 'Failed to connect to database', 
          dbConfigured: true,
          error: error.message 
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
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`Backend server running at http://localhost:${port}`);
    console.log(`Database status: ${isDatabaseConfigured ? 'configured' : 'not configured'}`);
  });
}

startServer();
