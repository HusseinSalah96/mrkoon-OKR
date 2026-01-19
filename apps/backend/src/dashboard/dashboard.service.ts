import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

@Injectable()
export class DashboardService {
    constructor(
        private prisma: PrismaService,
        private activityLogsService: ActivityLogsService
    ) { }

    async getStats(managerId?: number) {
        let whereUserClause: any = { role: 'EMPLOYEE' };
        let whereEvalClause: any = { isSubmitted: false };
        let teamId: number | null = null;

        if (managerId) {
            // Get managers team
            const manager = await this.prisma.user.findUnique({
                where: { id: managerId },
                include: { managedTeams: true }
            });
            // Assuming manager manages one team for now based on legacy logic or multiple?
            // Schema has `managedTeams Team[]`. Let's pick ids.
            if (manager && manager.managedTeams.length > 0) {
                const teamIds = manager.managedTeams.map(t => t.id);
                whereUserClause = { ...whereUserClause, teamId: { in: teamIds } };
                // Pending evaluations for employees in these teams
                // Evaluation -> Employee -> TeamId
                whereEvalClause = {
                    ...whereEvalClause,
                    employee: { teamId: { in: teamIds } }
                };
            } else {
                // Manager with no team? Return 0s
                return {
                    stats: { totalTeams: 0, totalEmployees: 0, pendingEvaluations: 0 },
                    recentActivity: []
                };
            }
        }

        // 1. Counts
        const totalTeams = await this.prisma.team.count(); // Managers can see total teams or just theirs? Let's leave global for context or restricting? User said "numbers isn't correct". Likely wants THEIR team count.
        // If manager, maybe Total Employees means "My Team Size".

        const totalEmployees = await this.prisma.user.count({ where: whereUserClause });
        // Pending evaluations
        const pendingEvaluations = await this.prisma.evaluation.count({ where: whereEvalClause });

        // 2. Recent Activity
        let activities: any[] = [];

        if (managerId) {
            // Keep existing logic for Managers (Evaluations + New Users in team)
            let evalActivityWhere: any = { isSubmitted: true };
            const manager = await this.prisma.user.findUnique({ where: { id: managerId }, include: { managedTeams: true } });
            if (manager?.managedTeams.length) {
                const tIds = manager.managedTeams.map(t => t.id);
                evalActivityWhere = { ...evalActivityWhere, employee: { teamId: { in: tIds } } };
            }

            const recentEvaluations = await this.prisma.evaluation.findMany({
                where: evalActivityWhere,
                take: 5,
                orderBy: { updatedAt: 'desc' },
                include: { employee: { select: { name: true } } }
            });

            // We can also fetch team member join logs if we wanted, but let's keep it simple for manager matching previous behavior
            const recentUsers = await this.prisma.user.findMany({
                where: whereUserClause,
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: { name: true, role: true, createdAt: true }
            });

            activities = [
                ...recentEvaluations.map(e => ({
                    type: 'EVALUATION_SUBMITTED',
                    date: e.updatedAt,
                    title: 'Evaluation Submitted',
                    description: `Evaluation for ${e.employee.name} was submitted`,
                    user: e.employee.name
                })),
                ...recentUsers.map(u => ({
                    type: 'USER_JOINED',
                    date: u.createdAt,
                    title: 'New Team Member',
                    description: `${u.name} joined as ${u.role.toLowerCase()}`,
                    user: u.name
                }))
            ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

        } else {
            // Admin: Use System Activity Logs
            const logs = await this.activityLogsService.getRecentLogs(20);
            activities = logs.map(log => ({
                type: log.action,
                date: log.createdAt,
                title: log.title,
                description: log.description,
                user: log.user.name
            }));
        }

        return {
            stats: {
                totalTeams,
                totalEmployees,
                pendingEvaluations
            },
            recentActivity: activities
        };
    }
}
