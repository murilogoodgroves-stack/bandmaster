import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import pool, { isDatabaseConfigured, query, getDatabaseStatus } from './db';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = process.env.PORT || 3000;

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Cron Job: Runs every minute
  cron.schedule('* * * * *', async () => {
    console.log('Running scheduled task: Logging to Firebase...');
    try {
      const logRef = collection(db, 'cron_logs');
      await addDoc(logRef, {
        timestamp: new Date().toISOString(),
        status: 'success',
        message: 'Cron job executed successfully',
        serverTime: serverTimestamp()
      });
      console.log('Cron job log saved to Firebase');
    } catch (error: any) {
      console.error('Cron job failed:', error);
    }
  });

  // Config status endpoint
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

  // Health Check Endpoint
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

  // Vite middleware for development
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

  // Start Server
  app.listen(port, () => {
    console.log(`Backend server running at http://localhost:${port}`);
    console.log(`Database status: ${isDatabaseConfigured ? 'configured' : 'not configured'}`);
  });
}

startServer();
