import prisma from "../../prisma/prisma.js";
export async function createExpense(data) {
    return await prisma.expense.create({
        data
    });
}
import { getStartAndEndOfDay } from "../reports/report.service.js";
export async function getExpenses(page, limit, month, year, sortOrder = "desc", date) {
    const take = limit && limit > 0 ? limit : undefined;
    const skip = take && page && page > 1 ? (page - 1) * take : undefined;
    let where = {};
    if (date) {
        const dayRange = getStartAndEndOfDay(date);
        if (dayRange) {
            where = { createdAt: { gte: dayRange.startDate, lte: dayRange.endDate } };
        }
    }
    else if (month && year) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);
        where = { createdAt: { gte: startDate, lte: endDate } };
    }
    const [data, total] = await Promise.all([
        prisma.expense.findMany({
            where,
            orderBy: { createdAt: sortOrder },
            ...(take && { take }),
            ...(skip && { skip })
        }),
        prisma.expense.count({ where })
    ]);
    return {
        data,
        total,
        page: page || 1,
        limit: take || total,
        totalPages: take ? Math.ceil(total / take) : 1
    };
}
export async function getExpenseById(id) {
    return await prisma.expense.findUnique({
        where: { id }
    });
}
export async function updateExpense(id, data) {
    return await prisma.expense.update({
        where: { id },
        data
    });
}
export async function deleteExpense(id) {
    return await prisma.expense.delete({
        where: { id }
    });
}
export async function bulkCreateExpenses(expenses) {
    const results = { success: 0, failed: 0, errors: [] };
    for (let i = 0; i < expenses.length; i++) {
        try {
            await createExpense(expenses[i]);
            results.success++;
        }
        catch (err) {
            results.failed++;
            results.errors.push(`Row ${i + 1}: ${err.message}`);
        }
    }
    return results;
}
