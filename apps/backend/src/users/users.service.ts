import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findOne(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { email },
            include: { team: true, managedTeams: true },
        });
    }

    async findById(id: number): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { id },
            include: { team: true },
        });
    }

    async create(data: Prisma.UserCreateInput): Promise<User> {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        return this.prisma.user.create({
            data: {
                ...data,
                password: hashedPassword,
            },
        });
    }

    async findAll(): Promise<User[]> {
        return this.prisma.user.findMany({
            include: { team: true },
        });
    }

    async update(id: number, data: any) {
        const updateData: any = {
            name: data.name,
            email: data.email,
            role: data.role,
            avatar: data.avatar
        };

        if (data.teamId !== undefined) {
            if (data.teamId) {
                updateData.team = { connect: { id: data.teamId } };
            } else {
                updateData.team = { disconnect: true };
            }
        }

        if (data.password && data.password.trim() !== '') {
            updateData.password = await bcrypt.hash(data.password, 10);
        }

        return this.prisma.user.update({
            where: { id },
            data: updateData
        });
    }
    async remove(id: number) {
        return this.prisma.$transaction(async (tx) => {
            // 1. Remove as manager from any teams
            await tx.team.updateMany({
                where: { managerId: id },
                data: { managerId: null }
            });

            // 2. Delete all evaluations for this user
            // Because Evaluation defines relation to Items/Comments without Cascade in schema (implicit), 
            // we might need to conform to DB constraints. 
            // Assuming SQLite logic or standard Prisma behavior. 
            // To be safe, we find evaluations first.
            const evaluations = await tx.evaluation.findMany({ where: { employeeId: id }, select: { id: true } });

            if (evaluations.length > 0) {
                const evalIds = evaluations.map(e => e.id);
                // Delete comments and items
                await tx.evaluationComment.deleteMany({ where: { evaluationId: { in: evalIds } } });
                await tx.evaluationItem.deleteMany({ where: { evaluationId: { in: evalIds } } });

                // Delete evaluations
                await tx.evaluation.deleteMany({ where: { employeeId: id } });
            }

            // 3. Delete the user
            return tx.user.delete({ where: { id } });
        });
    }
}
