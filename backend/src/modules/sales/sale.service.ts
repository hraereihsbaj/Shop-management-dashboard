import prisma from "../../prisma/prisma.js";

export async function createSale(data: any) {
  const { items, ...saleData } = data;

  // The $transaction ensures all database operations succeed together
  return await prisma.$transaction(async (tx) => {
    
    // 1. Create the Sale AND its related SaleItems simultaneously (Nested Write)
    const sale = await tx.sale.create({
      data: {
        paymentMethod: saleData.paymentMethod,
        totalAmount: saleData.totalAmount,
        ...(saleData.saleDate && { saleDate: saleData.saleDate }),
        
        // This automatically creates the rows in the SaleItem table!
        items: {
          create: items.map((item: any) => ({
            quantity: item.quantity,
            costPrice: item.costPrice,
            sellingPrice: item.sellingPrice,
            productId: item.productId || null,
            productName: item.productName || null
          }))
        }
      },
      include: {
        items: true // Return the items in the response so we can see them
      }
    });

    // 2. Loop through the items and validate stock, then decrease the Product stock
    for (const item of items) {
      if (!item.productId) {
        // Skip stock deduction for custom ad-hoc items
        continue;
      }

      const product = await tx.product.findUnique({
        where: { id: item.productId }
      });

      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }

      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`);
      }

      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity // Prisma's built-in math operation!
          }
        }
      });
    }

    return sale;
  });
}

import { getStartAndEndOfDay } from "../reports/report.service.js";

// A simple GET to fetch sales with pagination and date sorting
export async function getSales(page?: number, limit?: number, month?: number, year?: number, sortOrder: "asc" | "desc" = "desc", date?: string) {
  const take = limit && limit > 0 ? limit : undefined;
  const skip = take && page && page > 1 ? (page - 1) * take : undefined;

  let where = {};
  if (date) {
    const dayRange = getStartAndEndOfDay(date);
    if (dayRange) {
      where = { createdAt: { gte: dayRange.startDate, lte: dayRange.endDate } };
    }
  } else if (month && year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    where = { createdAt: { gte: startDate, lte: endDate } };
  }

  const [data, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      orderBy: { createdAt: sortOrder },
      include: {
        items: {
          include: {
            product: true
          }
        }
      },
      ...(take && { take }),
      ...(skip && { skip })
    }),
    prisma.sale.count({ where })
  ]);

  return {
    data,
    total,
    page: page || 1,
    limit: take || total,
    totalPages: take ? Math.ceil(total / take) : 1
  };
}

export async function deleteSale(id: string) {
  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!sale) {
      throw new Error("Sale not found");
    }

    // Restore stock for sold products that are tracked in inventory
    for (const item of sale.items) {
      if (item.productId) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity
            }
          }
        });
      }
    }

    // Delete sale items and sale
    await tx.saleItem.deleteMany({ where: { saleId: id } });
    return tx.sale.delete({ where: { id } });
  });
}

export async function updateSale(id: string, data: { paymentMethod?: string }) {
  return await prisma.sale.update({
    where: { id },
    data,
    include: { items: { include: { product: true } } }
  });
}

export async function bulkCreateSales(sales: any[]) {
  const results = { success: 0, failed: 0, errors: [] as string[] };
  
  for (let i = 0; i < sales.length; i++) {
    try {
      await createSale(sales[i]);
      results.success++;
    } catch (err: any) {
      results.failed++;
      results.errors.push(`Row ${i + 1}: ${err.message}`);
    }
  }
  
  return results;
}