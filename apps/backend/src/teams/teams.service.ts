import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Team, Prisma } from '@prisma/client';

@Injectable()
export class TeamsService {
    constructor(private prisma: PrismaService) { }

    async create(data: Prisma.TeamCreateInput): Promise<Team> {
        return this.prisma.team.create({ data });
    }

    async findAll(): Promise<Team[]> {
        return this.prisma.team.findMany({
            include: { manager: true, members: true }
        });
    }

    async update(id: number, data: Prisma.TeamUpdateInput): Promise<Team> {
        return this.prisma.team.update({
            where: { id },
            data,
        });
    }

    async findOne(id: number): Promise<Team | null> {
        return this.prisma.team.findUnique({
            where: { id },
            include: { manager: true, members: true, kpiGroups: true }
        });
    }
}
