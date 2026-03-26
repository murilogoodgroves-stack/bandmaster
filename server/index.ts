import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import pool from './db';
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

  // Health Check Endpoint
  app.get('/api/health', async (req, res) => {
    try {
      const result = await pool.query('SELECT NOW()');
      res.json({ 
          status: 'online', 
          message: 'Connected to Hostinger VPS Database', 
          dbTime: result.rows[0].now 
      });
    } catch (error: any) {
      console.error('Database connection error:', error);
      res.status(500).json({ 
          status: 'error', 
          message: 'Failed to connect to database', 
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
    console.log(`Targeting Database: ${process.env.DB_NAME} at ${process.env.DB_HOST}`);
  });
}

startServer();
