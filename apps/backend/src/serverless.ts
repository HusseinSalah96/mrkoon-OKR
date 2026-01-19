import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

let app: NestExpressApplication;

export default async function handler(req: any, res: any) {
    if (!app) {
        app = await NestFactory.create<NestExpressApplication>(AppModule);
        app.enableCors();
        // Static assets might behave differently in serverless, but we keep the config
        app.useStaticAssets(join(process.cwd(), 'uploads'), {
            prefix: '/uploads/',
        });
        await app.init();
    }
    const expressApp = app.getHttpAdapter().getInstance();
    return expressApp(req, res);
}
