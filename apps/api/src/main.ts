import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import type { NextFunction, Request, Response } from 'express';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { HttpErrorFilter } from './http/http-exception.filter.js';
import { createRateLimiter } from './http/rate-limit.js';

const envCandidates = [
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), '../../.env'),
];

for (const envPath of envCandidates) {
  if (existsSync(envPath)) {
    loadEnv({ path: envPath });
    break;
  }
}

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required in production`);
  }
  return value;
}

function corsOrigins() {
  const configured = (process.env.WEB_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const production = process.env.NODE_ENV === 'production';

  if (production) {
    required('DATABASE_URL');
    required('WEB_ORIGINS');
    if (!process.env.SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error('SUPABASE_URL is required in production');
    }
    if (
      !process.env.SUPABASE_ANON_KEY &&
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      throw new Error('SUPABASE_ANON_KEY is required in production');
    }
    return configured;
  }

  return [
    ...new Set([
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      ...configured,
    ]),
  ];
}

const generalLimit = createRateLimiter(180, 60_000);
const sensitiveLimit = createRateLimiter(12, 60_000);

function isSensitive(req: Request) {
  return (
    req.method === 'POST' &&
    (req.path === '/checkout' || req.path.endsWith('/cancel'))
  );
}

function rateLimit(req: Request, res: Response, next: NextFunction) {
  if (req.path === '/health') {
    next();
    return;
  }

  const result = (isSensitive(req) ? sensitiveLimit : generalLimit)(
    `${req.ip ?? 'unknown'}:${req.method}:${req.path}`,
  );
  if (!result.ok) {
    res.status(429).json({
      statusCode: 429,
      message: 'Too many requests. Please wait and try again.',
      error: 'Too Many Requests',
    });
    return;
  }
  next();
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  if (process.env.TRUST_PROXY === '1') {
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
  }
  app.use(rateLimit);
  app.useGlobalFilters(new HttpErrorFilter());
  app.enableCors({ origin: corsOrigins() });
  app.getHttpAdapter().getInstance().disable('x-powered-by');

  await app.listen(process.env.PORT ?? 3001);
}

await bootstrap();
