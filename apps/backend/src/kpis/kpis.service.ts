import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KpisService {
    constructor(private prisma: PrismaService) { }

    async createGroup(data: any) {
        // data: { name, weight, teamId?, targetRole? }
        return this.prisma.kpiGroup.create({
            data: {
                name: data.name,
                weight: data.weight,
                teamId: data.teamId || null, // Optional for global
                targetRole: data.targetRole || 'EMPLOYEE'
            }
        });
    }

    async createItem(data: any) {
        return this.prisma.kpiItem.create({ data });
    }

    async findByTeam(teamId: number) {
        // Legacy support: fetch Employee KPIs for this team
        return this.prisma.kpiGroup.findMany({
            where: { teamId, targetRole: 'EMPLOYEE' },
            include: { items: true }
        });
    }

    async findGlobalManagers() {
        return this.prisma.kpiGroup.findMany({
            where: { targetRole: 'MANAGER' },
            include: { items: true }
        });
    }

    async findForTarget(teamId: number, role: string) {
        if (role === 'MANAGER') {
            return this.findGlobalManagers();
        } else {
            return this.findByTeam(teamId);
        }
    }

    async updateGroup(id: number, data: any) {
        return this.prisma.kpiGroup.update({
            where: { id },
            data: {
                name: data.name,
                weight: data.weight
            }
        });
    }

    async updateItem(id: number, data: any) {
        return this.prisma.kpiItem.update({
            where: { id },
            data: {
                name: data.name,
                weight: data.weight
            }
        });
    }

    async findAll() {
        return this.prisma.kpiGroup.findMany({ include: { items: true } });
    }
}
