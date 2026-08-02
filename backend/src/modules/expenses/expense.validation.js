import { z } from "zod";
export const createExpenseSchema = z.object({
    title: z.string().min(1, "Title is required"),
    category: z.string().min(1, "Category is required"),
    amount: z.number().positive("Amount must be greater than 0"),
    notes: z.string().optional(),
    expenseDate: z.string().datetime().optional(), // Expects an ISO date string like "2026-08-01T00:00:00Z"
});
export const updateExpenseSchema = createExpenseSchema.partial();
