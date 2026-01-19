import { Controller, Post, Body, Param, Get, UseGuards, Query, Request, ForbiddenException } from '@nestjs/common';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { EvaluationsService } from './evaluations.service';
import { UsersService } from '../users/users.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { AuthGuard } from '@nestjs/passport';

@Controller('evaluations')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class EvaluationsController {
    constructor(
        private readonly evaluationsService: EvaluationsService,
        private readonly activityLogsService: ActivityLogsService,
        private readonly usersService: UsersService
    ) { }

    @Roles(Role.ADMIN, Role.MANAGER)
    @Post()
    async create(@Body() data: any, @Request() req: any) {
        // Security check: Managers cannot evaluate other Managers
        const targetId = data.userId || data.employeeId;
        if (targetId && req.user.role === Role.MANAGER) {
            const targetUser = await this.usersService.findById(+targetId);
            if (targetUser && targetUser.role === Role.MANAGER) {
                throw new ForbiddenException('Managers can only evaluate employees, not other managers.');
            }
        }

        return this.evaluationsService.create(data);
    }

    @Roles(Role.ADMIN, Role.MANAGER)
    @Post(':id/scores')
    async submitScores(@Param('id') id: string, @Body() body: any, @Request() req: any) {
        const result = await this.evaluationsService.submitScores(+id, body.items, body.comments);

        // Log activity
        await this.activityLogsService.log(req.user.userId, 'EVALUATION_UPDATED', { evaluationId: id });

        return result;
    }

    @Get(':id/score')
    getScore(@Param('id') id: string) {
        return this.evaluationsService.calculateScore(+id);
    }

    @Roles(Role.ADMIN, Role.MANAGER)
    @Get()
    findAll(@Request() req: any) {
        return this.evaluationsService.findAll(req.user);
    }

    @Roles(Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
    @Get('/user/:userId')
    async getUserLatestEvaluation(
        @Param('userId') userId: string,
        @Query('periods') periodsString?: string,
        @Request() req?: any
    ) {
        // Security check: Employees can only see their own
        if (req.user.role === Role.EMPLOYEE && req.user.userId !== +userId) {
            throw new ForbiddenException('You can only view your own evaluations');
        }

        const periods = periodsString ? periodsString.split(',') : undefined;
        const result = await this.evaluationsService.findByUserAndPeriods(+userId, periods);
        if (!result) return { message: 'No evaluation found' };
        return result;
    }

    @Roles(Role.ADMIN, Role.MANAGER)
    @Get('team/:teamId/stats')
    getTeamStats(@Param('teamId') teamId: string) {
        return this.evaluationsService.getTeamStats(+teamId);
    }

}
