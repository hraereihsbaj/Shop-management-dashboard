import type { Request, Response } from "express";
import { createProductSchema ,updateProductSchema} from "./product.validation.js";
import * as productService from "./product.service.js";
import * as xlsx from "xlsx";

export async function createProduct(req: Request, res: Response) {
  try {
    const validatedData = createProductSchema.parse(req.body);

    const product = await productService.createProduct(validatedData);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product
    });

  } catch (error: any) {

    res.status(400).json({
      success: false,
      message: error.message
    });

  }
}

// Add this below your existing createProduct function
export async function getProducts(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 0;
    const month = req.query.month ? parseInt(req.query.month as string) : undefined;
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    const sortOrder = (req.query.sort as string)?.toLowerCase() === "asc" ? "asc" : "desc";
    const date = req.query.date ? (req.query.date as string) : undefined;

    const result = await productService.getProducts(limit > 0 ? page : undefined, limit > 0 ? limit : undefined, month, year, sortOrder, date);

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
      message: error.message || "Failed to fetch products"
    });
  }
}

// Append these below your existing getProducts function:

export async function getProductById(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const product = await productService.getProductById(id);
    if (!product) {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }
    res.status(200).json({ success: true, data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateProduct(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const validatedData = updateProductSchema.parse(req.body);
    const updatedProduct = await productService.updateProduct(id, validatedData);
    
    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: updatedProduct
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function deleteProduct(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    await productService.deleteProduct(id);
    res.status(200).json({ success: true, message: "Product deleted successfully" });
  } catch (error: any) {
    res.status(400).json({ success: false, message: "Failed to delete product or product not found" });
  }
}

export async function uploadProducts(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: "No file uploaded" });
      return;
    }

    // Parse Excel/CSV from buffer
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json<any>(sheet);

    if (!rows || rows.length === 0) {
      res.status(400).json({ success: false, message: "The uploaded file is empty" });
      return;
    }

    const productsToCreate = rows.map((row: any) => ({
      name: row.name ? String(row.name).trim() : "",
      category: row.category ? String(row.category).trim() : "Uncategorized",
      costPrice: Number(row.costPrice) || 0,
      sellingPrice: Number(row.sellingPrice) || 0,
      stock: parseInt(row.stock) || 0
    }));

    // Filter out rows without a name
    const validProducts = productsToCreate.filter(p => p.name.length > 0);

    if (validProducts.length === 0) {
      res.status(400).json({ success: false, message: "No valid products found in file. Make sure columns match the template." });
      return;
    }

    const result = await productService.bulkCreateProducts(validProducts);

    res.status(200).json({
      success: true,
      message: `Processed ${validProducts.length} rows. ${result.success} succeeded, ${result.failed} failed.`,
      data: result
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Error parsing file: " + error.message });
  }
}

export async function getProductHistory(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id;
    const history = await productService.getProductHistory(id);
    res.status(200).json({ success: true, data: history });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch product history" });
  }
}