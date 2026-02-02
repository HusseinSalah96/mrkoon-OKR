import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

let app: NestExpressApplication;

const ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'https://mrkoon-okr-frontend.vercel.app',
];

export default async function handler(req: any, res: any) {
    const origin = req.headers.origin;

    // 🔑 REQUIRED FOR VERCEL EDGE CACHE
    res.setHeader('Vary', 'Origin');

    if (ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.setHeader(
        'Access-Control-Allow-Methods',
        'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    );
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization',
    );
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
    }

    if (!app) {
        app = await NestFactory.create<NestExpressApplication>(AppModule);

        app.useStaticAssets(join(process.cwd(), 'uploads'), {
            prefix: '/uploads/',
        });

        await app.init();
    }

    const expressApp = app.getHttpAdapter().getInstance();
    return expressApp(req, res);
}