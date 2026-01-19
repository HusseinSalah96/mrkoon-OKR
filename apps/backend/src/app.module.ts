import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { TeamsModule } from './teams/teams.module';
import { KpisModule } from './kpis/kpis.module';
import { EvaluationsModule } from './evaluations/evaluations.module';
import { DashboardModule } from './dashboard/dashboard.module';

import { ActivityLogsModule } from './activity-logs/activity-logs.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    PrismaModule,
    TeamsModule,
    KpisModule,
    EvaluationsModule,
    DashboardModule,
    ActivityLogsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
