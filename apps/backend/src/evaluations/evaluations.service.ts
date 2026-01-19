import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { Role } from '../auth/role.enum';

@Injectable()
export class EvaluationsService {
    constructor(private prisma: PrismaService) { }

    async create(data: any) {
        // Handle "create or get" logic
        const { userId, employeeId, quarter, year } = data;
        const targetId = userId || employeeId;

        return this.prisma.evaluation.upsert({
            where: {
                quarter_year_employeeId: {
                    quarter: quarter,
                    year: year,
                    employeeId: targetId
                }
            },
            update: {},
            create: {
                quarter,
                year,
                employee: { connect: { id: targetId } }
            }
        });
    }

    async submitScores(evaluationId: number, items: { kpiItemId: number, score: number }[], comments: { kpiGroupId: number, comment: string }[] = []) {
        console.log('Submitting scores:', { evaluationId, itemsCount: items.length, commentsCount: comments?.length });

        return this.prisma.$transaction(async (tx) => {
            // 1. Save Scores (Upsert)
            for (const item of items) {
                await tx.evaluationItem.upsert({
                    where: {
                        evaluationId_kpiItemId: {
                            evaluationId,
                            kpiItemId: item.kpiItemId
                        }
                    },
                    create: {
                        evaluationId,
                        kpiItemId: item.kpiItemId,
                        score: item.score
                    },
                    update: {
                        score: item.score
                    }
                });
            }

            // 2. Save Comments (Upsert)
            if (comments && comments.length > 0) {
                for (const comm of comments) {
                    if (comm.comment && comm.comment.trim() !== "") {
                        await tx.evaluationComment.upsert({
                            where: {
                                evaluationId_kpiGroupId: {
                                    evaluationId,
                                    kpiGroupId: comm.kpiGroupId
                                }
                            },
                            create: {
                                evaluationId,
                                kpiGroupId: comm.kpiGroupId,
                                comment: comm.comment
                            },
                            update: {
                                comment: comm.comment
                            }
                        });
                    }
                }
            }

            // 3. Mark Evaluation as Submitted
            await tx.evaluation.update({
                where: { id: evaluationId },
                data: { isSubmitted: true }
            });

            return this.calculateScore(evaluationId, tx as any);
        });
    }

    async calculateScore(evaluationId: number, tx: Prisma.TransactionClient = this.prisma) {
        const evaluation = await tx.evaluation.findUnique({
            where: { id: evaluationId },
            include: {
                items: { include: { kpiItem: { include: { kpiGroup: true } } } }
            }
        });

        if (!evaluation) throw new NotFoundException('Evaluation not found');

        const groupScores: Record<number, { score: number, weight: number, totalItemWeight: number, weightedSum: number }> = {};

        for (const item of evaluation.items) {
            const itemWeight = item.kpiItem.weight;
            const groupId = item.kpiItem.kpiGroupId;
            const groupWeight = item.kpiItem.kpiGroup.weight;

            // Initialize group data if not exists
            if (!groupScores[groupId]) {
                groupScores[groupId] = { score: 0, weight: groupWeight, totalItemWeight: 0, weightedSum: 0 };
            }

            // Accumulate weighted sum and total weight for the group
            groupScores[groupId].weightedSum += item.score * itemWeight;
            groupScores[groupId].totalItemWeight += itemWeight;
        }

        let finalScore = 0;
        for (const groupId in groupScores) {
            const group = groupScores[groupId];

            // Calculate actual group score: (Weighted Sum / Total Item Weight)
            // Example: (70*10 + 80*10 + 90*10 + 80*10) / 40 = 3200 / 40 = 80
            if (group.totalItemWeight > 0) {
                group.score = group.weightedSum / group.totalItemWeight;
            } else {
                group.score = 0;
            }

            // Add to final score based on group weight
            finalScore += group.score * (group.weight / 100);
        }

        // Clean up the temporary properties before returning
        const cleanGroupScores: Record<number, { score: number, weight: number }> = {};
        for (const id in groupScores) {
            cleanGroupScores[id] = {
                score: groupScores[id].score,
                weight: groupScores[id].weight
            };
        }

        return { finalScore, groupScores: cleanGroupScores };
    }

    async findAll(user: any) {
        if (user.role === Role.ADMIN) {
            return this.prisma.evaluation.findMany({
                include: {
                    employee: true
                },
                orderBy: { createdAt: 'desc' }
            });
        }

        if (user.role === Role.MANAGER) {
            // Find teams managed by this user
            const managedTeams = await this.prisma.team.findMany({
                where: { managerId: user.userId },
                select: { id: true }
            });

            const teamIds = managedTeams.map(t => t.id);

            return this.prisma.evaluation.findMany({
                where: {
                    OR: [
                        { employee: { teamId: { in: teamIds } } },
                        { employeeId: user.userId }
                    ]
                },
                include: {
                    employee: true
                },
                orderBy: { createdAt: 'desc' }
            });
        }

        return [];
    }

    async findByUserAndPeriods(userId: number, periods?: string[]) {
        // periods format: ["2024-Q1", "2025-Q1"]
        // If no periods provided, maybe fetch latest? Or all? Let's default to all for profile history context.

        let whereClause: any = { employeeId: userId };

        if (periods && periods.length > 0) {
            // Construct OR clause for Year+Quarter
            const orConditions = periods.map(p => {
                const [year, quarter] = p.split('-');
                return {
                    year: parseInt(year),
                    quarter: quarter
                };
            });
            whereClause = {
                ...whereClause,
                OR: orConditions
            };
        }

        const evaluations = await this.prisma.evaluation.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            include: {
                employee: { include: { team: true } },
                items: {
                    include: {
                        kpiItem: {
                            include: { kpiGroup: true }
                        }
                    }
                },
                comments: true
            }
        });

        if (evaluations.length === 0) return null;

        // --- AGGREGATION LOGIC ---

        // We need to merge scores for the same KPI Item across multiple evaluations.
        // Map: KpiItemId -> { info: KpiItem, scores: number[] }
        const kpiMap: Record<number, { info: any, scores: number[] }> = {};
        const groupInfo: Record<number, any> = {}; // GroupId -> GroupInfo
        const latestComments: Record<number, { comment: string, date: Date }> = {}; // GroupId -> Latest Comment

        for (const evaluation of evaluations) {
            // Collect Scores
            for (const item of evaluation.items) {
                const kpiId = item.kpiItem.id;
                if (!kpiMap[kpiId]) {
                    kpiMap[kpiId] = {
                        info: item.kpiItem,
                        scores: []
                    };
                }
                kpiMap[kpiId].scores.push(item.score);

                // Track Group Info (assume static)
                const groupId = item.kpiItem.kpiGroupId;
                if (!groupInfo[groupId]) {
                    groupInfo[groupId] = item.kpiItem.kpiGroup;
                }
            }

            // Collect Comments (Keep track of latest date to pick the newest one)
            if (evaluation.comments) {
                for (const comm of evaluation.comments) {
                    const existing = latestComments[comm.kpiGroupId];
                    if (!existing || evaluation.createdAt > existing.date) {
                        latestComments[comm.kpiGroupId] = {
                            comment: comm.comment,
                            date: evaluation.createdAt
                        };
                    }
                }
            }
        }

        // Calculate Averages and Reconstruct Virtual Evaluation Structure
        const aggregatedGroups: Record<number, any> = {};

        // 1. Build Groups and Items with Averaged Scores
        for (const kpiId in kpiMap) {
            const entry = kpiMap[kpiId];
            const avgScore = entry.scores.reduce((sum, s) => sum + s, 0) / entry.scores.length;
            const groupId = entry.info.kpiGroupId;

            if (!aggregatedGroups[groupId]) {
                aggregatedGroups[groupId] = {
                    id: groupId,
                    name: groupInfo[groupId].name,
                    weight: groupInfo[groupId].weight,
                    items: [],
                    comment: latestComments[groupId]?.comment || ''
                };
            }

            aggregatedGroups[groupId].items.push({
                id: entry.info.id,
                name: entry.info.name,
                weight: entry.info.weight,
                score: parseFloat(avgScore.toFixed(2)) // Round to 2 decimals
            });
        }

        // 2. Recalculate Group Scores and Final Score based on the Aggregated/Averaged Data
        let finalScore = 0;
        const groupScores: Record<number, any> = {};

        for (const groupId in aggregatedGroups) {
            const group = aggregatedGroups[groupId];

            // Calculate Group Score
            let weightedSum = 0;
            let totalItemWeight = 0;

            for (const item of group.items) {
                weightedSum += item.score * item.weight;
                totalItemWeight += item.weight;
            }

            const groupScore = totalItemWeight > 0 ? (weightedSum / totalItemWeight) : 0;

            groupScores[groupId] = {
                score: parseFloat(groupScore.toFixed(2)),
                weight: group.weight
            };

            finalScore += groupScores[groupId].score * (group.weight / 100);
        }

        // Fetch available periods logic (distinct year/quarter for this user)
        const allUserEvals = await this.prisma.evaluation.findMany({
            where: { employeeId: userId },
            select: { year: true, quarter: true },
            distinct: ['year', 'quarter'],
            orderBy: [{ year: 'desc' }, { quarter: 'desc' }]
        });

        const availablePeriods = allUserEvals.map(e => `${e.year}-${e.quarter}`);

        // Return structure compatible with frontend expectation
        return {
            evaluation: evaluations[0], // Return metadata of the latest one for user info context
            groups: Object.values(aggregatedGroups),
            finalScore: parseFloat(finalScore.toFixed(2)),
            groupScores,
            availablePeriods
        };
    }

    async getTeamStats(teamId: number) {
        // 1. Get all team members
        const members = await this.prisma.user.findMany({
            where: { teamId: teamId }
        });

        if (members.length === 0) return { overallScore: 0, memberCount: 0 };

        let totalScore = 0;
        let evaluatedMembers = 0;

        for (const member of members) {
            // Get latest evaluation
            const evaluation = await this.prisma.evaluation.findFirst({
                where: { employeeId: member.id },
                orderBy: { createdAt: 'desc' },
                include: {
                    items: {
                        include: { kpiItem: { include: { kpiGroup: true } } }
                    }
                }
            });

            if (evaluation) {
                const { finalScore } = await this.calculateScore(evaluation.id);
                totalScore += finalScore;
                evaluatedMembers++;
            }
        }

        const overallScore = evaluatedMembers > 0 ? (totalScore / evaluatedMembers) : 0;

        return {
            overallScore,
            memberCount: members.length,
            evaluatedCount: evaluatedMembers
        };
    }
}
