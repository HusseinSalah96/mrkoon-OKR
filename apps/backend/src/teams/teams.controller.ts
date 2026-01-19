import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { AuthGuard } from '@nestjs/passport';

@Controller('teams')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class TeamsController {
    constructor(private readonly teamsService: TeamsService) { }

    @Roles(Role.ADMIN)
    @Post()
    create(@Body() data: any) {
        return this.teamsService.create(data);
    }

    @Roles(Role.ADMIN)
    @Post(':id')
    update(@Param('id') id: string, @Body() data: any) {
        return this.teamsService.update(+id, data);
    }

    @Roles(Role.ADMIN, Role.MANAGER)
    @Get()
    findAll() {
        return this.teamsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.teamsService.findOne(+id);
    }
}
