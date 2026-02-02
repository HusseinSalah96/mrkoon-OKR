import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

let app: NestExpressApplication;

export default async function handler(req: any, res: any) {
    // Manually handle CORS
    const origin = req.headers.origin || '*';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');


    // DEBUG LOGS
    console.log('Incoming Request:', req.method, req.url);
    console.log('Origin Header:', req.headers.origin);
    console.log('Computed Allow-Origin:', origin);

    if (req.method === 'OPTIONS') {
        res.statusCode = 200;
        res.end();
        return;
    }

    if (!app) {
        app = await NestFactory.create<NestExpressApplication>(AppModule);
        // REMOVED app.enableCors() to avoid double-setting headers

        // Static assets might behave differently in serverless, but we keep the config
        app.useStaticAssets(join(process.cwd(), 'uploads'), {
            prefix: '/uploads/',
        });
        await app.init();
    }
    await app.init();
}
const expressApp = app.getHttpAdapter().getInstance();
return expressApp(req, res);
}
