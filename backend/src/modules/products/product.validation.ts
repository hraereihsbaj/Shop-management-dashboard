import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().trim().min(2, "Product name is required"),

  category: z.string().trim().min(2, "Category is required"),

  costPrice: z.number().positive("Cost price must be greater than 0"),

  sellingPrice: z.number().positive("Selling price must be greater than 0"),

  stock: z.number().int().min(0),

  createdAt: z.string().datetime().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

// Partial update — each field is optional, but if provided, same rules apply
export const updateProductSchema = z.object({
  name: z.string().trim().min(2, "Product name is required").optional(),
  category: z.string().trim().min(2, "Category is required").optional(),
  costPrice: z.number().positive("Cost price must be greater than 0").optional(),
  sellingPrice: z.number().positive("Selling price must be greater than 0").optional(),
  stock: z.number().int().min(0).optional(),
  createdAt: z.string().datetime().optional(),
});