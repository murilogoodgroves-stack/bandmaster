import type { Request, Response } from 'express';
import type { Express } from 'express';
import { createApp } from '../server/index.js';

let appPromise: Promise<Express> | undefined;

export default async function handler(req: Request, res: Response) {
  appPromise ??= createApp({ initializeDatabase: false, serveFrontend: false });
  const app = await appPromise;
  return app(req, res);
}
