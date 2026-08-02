import { z } from "zod";
// Validate individual items in the cart
const saleItemSchema = z.object({
    productId: z.string().min(1, "Product ID is required"),
    quantity: z.number().int().positive("Quantity must be greater than 0"),
    costPrice: z.number().nonnegative(),
    sellingPrice: z.number().nonnegative()
});
// Validate the overall sale
export const createSaleSchema = z.object({
    paymentMethod: z.string().min(1, "Payment method is required"),
    totalAmount: z.number().positive("Total amount must be greater than 0"),
    saleDate: z.string().datetime().optional(),
    items: z.array(saleItemSchema).min(1, "Sale must contain at least one item")
});
