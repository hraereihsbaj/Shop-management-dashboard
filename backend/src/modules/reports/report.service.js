import prisma from "../../prisma/prisma.js";
export function getStartAndEndOfDay(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d.getTime()))
        return null;
    const year = d.getFullYear();
    const month = d.getMonth();
    const day = d.getDate();
    const startDate = new Date(year, month, day, 0, 0, 0, 0);
    const endDate = new Date(year, month, day, 23, 59, 59, 999);
    return { startDate, endDate };
}
export async function getProfitAndLoss(month, year, date) {
    let dateFilter = {};
    if (date) {
        const dayRange = getStartAndEndOfDay(date);
        if (dayRange) {
            dateFilter = {
                createdAt: {
                    gte: dayRange.startDate,
                    lte: dayRange.endDate
                }
            };
        }
    }
    else if (month && year) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);
        dateFilter = {
            createdAt: {
                gte: startDate,
                lte: endDate
            }
        };
    }
    // 1. Fetch sales and expenses filtered by date if specified
    const sales = await prisma.sale.findMany({
        where: dateFilter,
        include: { items: true }
    });
    const expenses = await prisma.expense.findMany({
        where: dateFilter
    });
    const products = await prisma.product.findMany({
        include: { saleItems: { select: { quantity: true, costPrice: true } } }
    });
    // 2. Initialize our financial buckets
    let totalRevenue = 0;
    let totalCOGS = 0;
    let totalExpenses = 0;
    let totalInventoryValue = 0;
    let totalInitialCosts = 0;
    // 3. Calculate Revenue and Cost of Goods Sold (COGS)
    for (const sale of sales) {
        totalRevenue += Number(sale.totalAmount);
        for (const item of sale.items) {
            totalCOGS += Number(item.costPrice) * item.quantity;
        }
    }
    // 4. Calculate Operating Expenses
    for (const expense of expenses) {
        totalExpenses += Number(expense.amount);
    }
    // 5. Calculate Profits & Inventory Value
    const grossProfit = totalRevenue - totalCOGS;
    const netProfit = grossProfit - totalExpenses;
    for (const p of products) {
        if (p.stock > 0) {
            totalInventoryValue += Number(p.costPrice) * p.stock;
        }
        const soldStockCost = p.saleItems?.reduce((sum, item) => sum + (Number(item.costPrice) * item.quantity), 0) || 0;
        const currentStockCost = p.stock > 0 ? (Number(p.costPrice) * p.stock) : 0;
        totalInitialCosts += soldStockCost + currentStockCost;
    }
    // 6. Return the finalized P&L Report
    return {
        totalRevenue,
        totalCOGS,
        grossProfit,
        totalExpenses,
        netProfit,
        totalInventoryValue,
        totalInitialCosts
    };
}
export async function getChartData(period) {
    const now = new Date();
    let startDate = new Date();
    let dateFormat = 'day'; // 'day' or 'month'
    if (period === 'year') {
        startDate.setFullYear(now.getFullYear() - 1);
        dateFormat = 'month';
    }
    else if (period === 'month') {
        startDate.setDate(now.getDate() - 30);
    }
    else {
        // default to week
        startDate.setDate(now.getDate() - 7);
    }
    // Fetch sales and expenses from startDate to now
    const sales = await prisma.sale.findMany({
        where: { createdAt: { gte: startDate } },
        include: { items: { select: { quantity: true, costPrice: true } } }
    });
    const expenses = await prisma.expense.findMany({
        where: { createdAt: { gte: startDate } }
    });
    // Group by date
    const dataMap = new Map();
    const getFormat = (d) => {
        if (dateFormat === 'month') {
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        }
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };
    // Seed the map with empty values so we have a continuous timeline
    let curr = new Date(startDate);
    while (curr <= now) {
        const key = getFormat(curr);
        if (!dataMap.has(key)) {
            dataMap.set(key, { revenue: 0, cogs: 0, expense: 0 });
        }
        if (dateFormat === 'month') {
            curr.setMonth(curr.getMonth() + 1);
        }
        else {
            curr.setDate(curr.getDate() + 1);
        }
    }
    // Add sales and COGS
    sales.forEach(s => {
        const key = getFormat(new Date(s.createdAt));
        if (dataMap.has(key)) {
            dataMap.get(key).revenue += Number(s.totalAmount);
            const cogs = s.items.reduce((sum, item) => sum + (Number(item.costPrice) * item.quantity), 0);
            dataMap.get(key).cogs += cogs;
        }
    });
    // Add expenses
    expenses.forEach(e => {
        const key = getFormat(new Date(e.createdAt));
        if (dataMap.has(key)) {
            dataMap.get(key).expense += Number(e.amount);
        }
    });
    // Convert to array and format label
    const result = Array.from(dataMap.entries()).map(([date, values]) => {
        let label = date;
        if (dateFormat === 'month') {
            const d = new Date(date + '-01');
            label = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
        }
        else {
            const d = new Date(date);
            label = d.toLocaleString('en-US', { month: 'short', day: 'numeric' });
        }
        const totalInvested = values.cogs + values.expense;
        return {
            date: label, // user-friendly label for x-axis
            rawDate: date,
            revenue: values.revenue,
            invested: totalInvested,
            profit: values.revenue - totalInvested
        };
    });
    return result;
}
