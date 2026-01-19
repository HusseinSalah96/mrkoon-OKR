
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Deleting all EvaluationItem and EvaluationComment records...');
    await prisma.evaluationItem.deleteMany({});
    await prisma.evaluationComment.deleteMany({});
    console.log('Done.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
