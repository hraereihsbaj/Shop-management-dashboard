import prisma from "../../prisma/prisma.js";
import type { CreateProductInput } from "./product.validation.js";

export async function createProduct(data: CreateProductInput) {
  const existingProduct = await prisma.product.findFirst({
    where: {
      name: {
        equals: data.name.trim(),
        mode: "insensitive"
      }
    }
  });

  return await prisma.$transaction(async (tx) => {
    let product;
    if (existingProduct) {
      product = await tx.product.update({
        where: { id: existingProduct.id },
        data: {
          category: data.category.trim(),
          costPrice: data.costPrice,
          sellingPrice: data.sellingPrice,
          isActive: true,
          stock: {
            increment: data.stock
          }
        }
      });
    } else {
      product = await tx.product.create({
        data: {
          ...data,
          name: data.name.trim(),
          category: data.category.trim()
        }
      });
    }

    if (data.stock > 0) {
      await tx.productHistory.create({
        data: {
          productId: product.id,
          quantityAdded: data.stock,
          costPrice: data.costPrice,
          sellingPrice: data.sellingPrice
        }
      });
    }

    return product;
  });
}

// Append this to your existing service file
import { getStartAndEndOfDay } from "../reports/report.service.js";

export async function getProducts(page?: number, limit?: number, month?: number, year?: number, sortOrder: "asc" | "desc" = "desc", date?: string) {
  const take = limit && limit > 0 ? limit : undefined;
  const skip = take && page && page > 1 ? (page - 1) * take : undefined;

  let where: any = { isActive: true };
  if (date) {
    const dayRange = getStartAndEndOfDay(date);
    if (dayRange) {
      where.createdAt = { gte: dayRange.startDate, lte: dayRange.endDate };
    }
  } else if (month && year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    where.createdAt = { gte: startDate, lte: endDate };
  }

  const [data, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: sortOrder },
      include: {
        saleItems: {
          select: {
            quantity: true,
            costPrice: true
          }
        }
      },
      ...(take && { take }),
      ...(skip && { skip })
    }),
    prisma.product.count({ where })
  ]);

  return {
    data,
    total,
    page: page || 1,
    limit: take || total,
    totalPages: take ? Math.ceil(total / take) : 1
  };
}

// Append these to your existing service file

export async function getProductById(id: string) {
  return await prisma.product.findUnique({
    where: { id }
  });
}

export async function updateProduct(id: string, data: any) {
  return await prisma.product.update({
    where: { id },
    data
  });
}

export async function deleteProduct(id: string) {
  return await prisma.product.update({
    where: { id },
    data: { isActive: false }
  });
}

export async function bulkCreateProducts(products: CreateProductInput[]) {
  const results = { success: 0, failed: 0, errors: [] as string[] };
  
  for (let i = 0; i < products.length; i++) {
    try {
      await createProduct(products[i]);
      results.success++;
    } catch (err: any) {
      results.failed++;
      results.errors.push(`Row ${i + 1}: ${err.message}`);
    }
  }
  
  return results;
}

export async function getProductHistory(id: string) {
  return await prisma.productHistory.findMany({
    where: { productId: id },
    orderBy: { createdAt: "desc" }
  });
}