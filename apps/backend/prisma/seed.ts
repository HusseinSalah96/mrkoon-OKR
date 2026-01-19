import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const adminEmail = 'admin@mrkoon.com';
    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

    if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await prisma.user.create({
            data: {
                email: adminEmail,
                name: 'Admin User',
                password: hashedPassword,
                role: 'ADMIN',
            },
        });
        console.log('Admin user created');
    } else {
        console.log('Admin user already exists');
    }

    const managerEmail = 'manager@mrkoon.com';
    const existingManager = await prisma.user.findUnique({ where: { email: managerEmail } });
    if (!existingManager) {
        const hashedPassword = await bcrypt.hash('manager123', 10);
        await prisma.user.create({
            data: {
                email: managerEmail,
                name: 'Manager User',
                password: hashedPassword,
                role: 'MANAGER',
            },
        });
        console.log('Manager user created');
    }

    const employeeEmail = 'employee@mrkoon.com';
    const existingEmployee = await prisma.user.findUnique({ where: { email: employeeEmail } });
    if (!existingEmployee) {
        const hashedPassword = await bcrypt.hash('employee123', 10);
        await prisma.user.create({
            data: {
                email: employeeEmail,
                name: 'Employee User',
                password: hashedPassword,
                role: 'EMPLOYEE',
            },
        });
        console.log('Employee user created');
    }

}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
