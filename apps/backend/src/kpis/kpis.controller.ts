import { Controller, Get, Post, Body, Param, UseGuards, Patch, Request } from '@nestjs/common';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { KpisService } from './kpis.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { AuthGuard } from '@nestjs/passport';

@Controller('kpis')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class KpisController {
    constructor(
        private readonly kpisService: KpisService,
        private readonly activityLogsService: ActivityLogsService
    ) { }

    @Roles(Role.ADMIN)
    @Post('groups')
    async createGroup(@Body() data: any, @Request() req: any) {
        const group = await this.kpisService.createGroup(data);
        await this.activityLogsService.log(req.user.userId, 'KPI_GROUP_CREATED', { groupName: group.name });
        return group;
    }

    @Roles(Role.ADMIN)
    @Post('items')
    async createItem(@Body() data: any, @Request() req: any) {
        const item = await this.kpisService.createItem(data);
        await this.activityLogsService.log(req.user.userId, 'KPI_ITEM_CREATED', { itemName: item.name });
        return item;
    }

    @Roles(Role.ADMIN)
    @Patch('groups/:id')
    async updateGroup(@Param('id') id: string, @Body() data: any, @Request() req: any) {
        const group = await this.kpisService.updateGroup(+id, data);
        await this.activityLogsService.log(req.user.userId, 'KPI_GROUP_UPDATED', { groupName: group.name });
        return group;
    }

    @Roles(Role.ADMIN)
    @Patch('items/:id')
    async updateItem(@Param('id') id: string, @Body() data: any, @Request() req: any) {
        const item = await this.kpisService.updateItem(+id, data);
        await this.activityLogsService.log(req.user.userId, 'KPI_ITEM_UPDATED', { itemName: item.name });
        return item;
    }

    @Get('team/:teamId')
    findByTeam(@Param('teamId') teamId: string) {
        // Keeps existing behavior for Employees
        return this.kpisService.findByTeam(+teamId);
    }

    @Get('managers')
    findManagerKPIs() {
        return this.kpisService.findGlobalManagers();
    }

}
