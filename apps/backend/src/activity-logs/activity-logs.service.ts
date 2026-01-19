import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActivityLogsService {
    constructor(private prisma: PrismaService) { }

    async log(userId: number, action: string, details?: any) {
        try {
            await this.prisma.activityLog.create({
                data: {
                    userId,
                    action,
                    details: details ? JSON.stringify(details) : null,
                },
            });
        } catch (error) {
            console.error('Failed to log activity:', error);
        }
    }

    async getRecentLogs(limit: number = 20) {
        const logs = await this.prisma.activityLog.findMany({
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { id: true, name: true, role: true, email: true }
                }
            }
        });

        return logs.map(log => ({
            ...log,
            title: this.formatTitle(log),
            description: this.formatDescription(log)
        }));
    }

    private formatTitle(log: any): string {
        const userName = log.user.name;
        switch (log.action) {
            case 'LOGIN': return `${userName} Logged In`;
            case 'EVALUATION_UPDATED': return `${userName} Updated Evaluation`;
            case 'KPI_GROUP_CREATED': return `${userName} Created KPI Group`;
            case 'KPI_GROUP_UPDATED': return `${userName} Updated KPI Group`;
            case 'USER_CREATED': return `${userName} Created User`;
            case 'USER_DELETED': return `${userName} Deleted User`;
            case 'USER_UPDATED': return `${userName} Updated User`;
            default: return `${userName} performed ${log.action}`;
        }
    }

    private formatDescription(log: any): string {
        const details = log.details ? JSON.parse(log.details) : {};
        switch (log.action) {
            case 'LOGIN': return `Logged in via ${details.method || 'email'}`;
            case 'EVALUATION_UPDATED': return `Updated evaluation for ${details.employeeName || 'employee'}`;
            case 'KPI_GROUP_CREATED': return `Created group "${details.groupName}"`;
            case 'USER_CREATED': return `Created user "${details.userName}"`;
            case 'USER_DELETED': return `Deleted user ID ${details.targetUserId}`;
            default: return '';
        }
    }
}
