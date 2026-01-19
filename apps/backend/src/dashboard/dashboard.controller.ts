import { Controller, Get, UseGuards, Request as Req } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';

@Controller('dashboard')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Roles(Role.ADMIN, Role.MANAGER)
    @Get()
    async getDashboardStats(@Req() req) {
        const user = req.user;
        const managerId = user.role === Role.MANAGER ? user.id : undefined;
        return this.dashboardService.getStats(managerId);
    }
}
