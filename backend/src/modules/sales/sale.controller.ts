import type { Request, Response } from "express";
import { createSaleSchema } from "./sale.validation.js";
import * as saleService from "./sale.service.js";
import * as xlsx from "xlsx";
import prisma from "../../prisma/prisma.js";

export async function createSale(req: Request, res: Response) {
  try {
    const validatedData = createSaleSchema.parse(req.body);
    const sale = await saleService.createSale(validatedData);

    res.status(201).json({
      success: true,
      message: "Sale completed successfully",
      data: sale
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

export async function getSales(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 0;
    const month = req.query.month ? parseInt(req.query.month as string) : undefined;
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    const sortOrder = (req.query.sort as string)?.toLowerCase() === "asc" ? "asc" : "desc";
    const date = req.query.date ? (req.query.date as string) : undefined;

    const result = await saleService.getSales(limit > 0 ? page : undefined, limit > 0 ? limit : undefined, month, year, sortOrder, date);

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch sales"
    });
  }
}

export async function deleteSale(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    await saleService.deleteSale(id);
    res.status(200).json({ success: true, message: "Sale deleted successfully and stock restored" });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || "Failed to delete sale" });
  }
}

export async function uploadSales(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: "No file uploaded" });
      return;
    }

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json<any>(sheet);

    if (!rows || rows.length === 0) {
      res.status(400).json({ success: false, message: "The uploaded file is empty" });
      return;
    }

    // Process each row, group by some ID if they belong to same sale? 
    // Usually bulk CSV implies 1 row = 1 sale with 1 item.
    const salesToCreate = [];
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const productName = row.productName ? String(row.productName).trim() : "";
      const quantity = parseInt(row.quantity);
      const paymentMethod = row.paymentMethod ? String(row.paymentMethod).trim() : "Cash";

      if (!productName || isNaN(quantity) || quantity <= 0) {
        errors.push(`Row ${i + 1}: Missing or invalid productName or quantity`);
        continue;
      }

      // Find product (case insensitive)
      const found = await prisma.product.findMany({
        where: { name: { contains: productName, mode: "insensitive" } }
      });
      const product = found[0];

      if (!product) {
        errors.push(`Row ${i + 1}: Product "${productName}" does not exist in inventory. Skipped.`);
        continue;
      }

      salesToCreate.push({
        paymentMethod,
        totalAmount: Number(product.sellingPrice) * quantity,
        items: [{
          productId: product.id,
          quantity,
          costPrice: product.costPrice,
          sellingPrice: product.sellingPrice
        }]
      });
    }

    if (salesToCreate.length === 0) {
      res.status(400).json({ 
        success: false, 
        message: "No valid sales could be imported.",
        errors 
      });
      return;
    }

    const result = await saleService.bulkCreateSales(salesToCreate);
    // Merge the custom errors we found during parsing
    result.errors.push(...errors);
    result.failed += errors.length;

    res.status(200).json({
      success: true,
      message: `Processed ${rows.length} rows. ${result.success} succeeded, ${result.failed} failed.`,
      data: result
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Error parsing file: " + error.message });
  }
}