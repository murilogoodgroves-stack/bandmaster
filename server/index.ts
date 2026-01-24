import express from 'express';
import cors from 'cors';
import pool from './db';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

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

// Start Server
app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
  console.log(`Targeting Database: bandhq at 76.13.161.88`);
});