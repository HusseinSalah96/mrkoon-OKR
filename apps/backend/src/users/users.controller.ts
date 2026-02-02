import { Controller, Get, Post, Body, UseGuards, Param, Patch, Delete, ForbiddenException, NotFoundException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { put } from '@vercel/blob';
import { UsersService } from './users.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { AuthGuard } from '@nestjs/passport';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { Request } from '@nestjs/common';

@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly activityLogsService: ActivityLogsService
    ) { }

    @Roles(Role.ADMIN)
    @Post()
    async create(@Body() data: any, @Request() req: any) {
        // Log creator (Admin)
        const newUser = await this.usersService.create(data);
        await this.activityLogsService.log(req.user.userId, 'USER_CREATED', { userName: newUser.name });
        return newUser;
    }

    @Roles(Role.ADMIN, Role.MANAGER)
    @Get()
    findAll() {
        return this.usersService.findAll();
    }

    @Get(':id')
    @Roles(Role.ADMIN, Role.MANAGER)
    findOne(@Param('id') id: string) {
        return this.usersService.findById(+id);
    }

    @Roles(Role.ADMIN)
    @Patch(':id')
    update(@Param('id') id: string, @Body() data: any) {
        return this.usersService.update(+id, data);
    }

    @Delete(':id')
    @Roles(Role.ADMIN)
    async remove(@Param('id') id: string, @Request() req: any) {
        const userId = +id;
        const user = await this.usersService.findById(userId);
        if (!user) throw new NotFoundException('User not found');
        if (user.role === Role.ADMIN) {
            throw new ForbiddenException('Cannot delete an Admin user');
        }
        await this.usersService.remove(userId);
        await this.activityLogsService.log(req.user.userId, 'USER_DELETED', { targetUserId: userId, targetUserName: user.name });
        return { success: true };
    }

    @Post(':id/avatar')
    @UseInterceptors(FileInterceptor('file'))
    async uploadAvatar(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
        const { url } = await put(file.originalname, file.buffer, { access: 'public', token: process.env.BLOB_READ_WRITE_TOKEN });
        await this.usersService.update(+id, { avatar: url });
        return { avatarUrl: url };
    }
}
