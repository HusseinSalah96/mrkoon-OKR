import { Module } from '@nestjs/common';
import { EvaluationsController } from './evaluations.controller';
import { EvaluationsService } from './evaluations.service';

import { UsersModule } from '../users/users.module';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

@Module({
  imports: [UsersModule, ActivityLogsModule],
  controllers: [EvaluationsController],
  providers: [EvaluationsService]
})
export class EvaluationsModule { }
