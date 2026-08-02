import type { Request, Response } from "express";
import { createExpenseSchema, updateExpenseSchema } from "./expense.validation.js";
import * as expenseService from "./expense.service.js";
import * as xlsx from "xlsx";

export async function createExpense(req: Request, res: Response) {
  try {
    const validatedData = createExpenseSchema.parse(req.body);
    const expense = await expenseService.createExpense(validatedData);

    res.status(201).json({
      success: true,
      message: "Expense created successfully",
      data: expense
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

export async function getExpenses(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 0;
    const month = req.query.month ? parseInt(req.query.month as string) : undefined;
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    const sortOrder = (req.query.sort as string)?.toLowerCase() === "asc" ? "asc" : "desc";
    const date = req.query.date ? (req.query.date as string) : undefined;

    const result = await expenseService.getExpenses(limit > 0 ? page : undefined, limit > 0 ? limit : undefined, month, year, sortOrder, date);

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
      message: error.message || "Failed to fetch expenses"
    });
  }
}

export async function getExpenseById(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const expense = await expenseService.getExpenseById(id);
    if (!expense) {
      res.status(404).json({ success: false, message: "Expense not found" });
      return;
    }
    res.status(200).json({ success: true, data: expense });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateExpense(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const validatedData = updateExpenseSchema.parse(req.body);
    const updatedExpense = await expenseService.updateExpense(id, validatedData);
    
    res.status(200).json({
      success: true,
      message: "Expense updated successfully",
      data: updatedExpense
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function deleteExpense(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    await expenseService.deleteExpense(id);
    res.status(200).json({ success: true, message: "Expense deleted successfully" });
  } catch (error: any) {
    res.status(400).json({ success: false, message: "Failed to delete expense or expense not found" });
  }
}

export async function uploadExpenses(req: Request, res: Response): Promise<void> {
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

    const expensesToCreate = rows.map((row: any) => ({
      title: row.title ? String(row.title).trim() : "",
      category: row.category ? String(row.category).trim() : "Uncategorized",
      amount: Number(row.amount) || 0,
      notes: row.notes ? String(row.notes).trim() : ""
    }));

    const validExpenses = expensesToCreate.filter(e => e.title.length > 0 && e.amount > 0);

    if (validExpenses.length === 0) {
      res.status(400).json({ success: false, message: "No valid expenses found in file." });
      return;
    }

    const result = await expenseService.bulkCreateExpenses(validExpenses);

    res.status(200).json({
      success: true,
      message: `Processed ${validExpenses.length} rows. ${result.success} succeeded, ${result.failed} failed.`,
      data: result
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Error parsing file: " + error.message });
  }
}