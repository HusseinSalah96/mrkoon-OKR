import { Module, Global } from '@nestjs/common';
import { ActivityLogsService } from './activity-logs.service';
import { PrismaService } from '../prisma/prisma.service';

@Global()
@Module({
    providers: [ActivityLogsService, PrismaService],
    exports: [ActivityLogsService],
})
export class ActivityLogsModule { }
