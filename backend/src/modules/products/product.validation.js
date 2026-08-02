import { z } from "zod";
export const createProductSchema = z.object({
    name: z.string().trim().min(2, "Product name is required"),
    category: z.string().trim().min(2, "Category is required"),
    costPrice: z.number().positive("Cost price must be greater than 0"),
    sellingPrice: z.number().positive("Selling price must be greater than 0"),
    stock: z.number().int().min(0)
});
// Add this to your existing validation file
export const updateProductSchema = createProductSchema.partial();
