import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import productRoutes from "./modules/products/product.routes.js";
import expenseRoutes from "./modules/expenses/expense.routes.js";
import saleRoutes from "./modules/sales/sale.routes.js";
import reportRoutes from "./modules/reports/report.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import { requireAuth } from "./middleware/auth.middleware.js";
const app = express();
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use("/api/auth", authRoutes);
// Protected Routes
app.use("/api/products", requireAuth, productRoutes);
app.use("/api/expenses", requireAuth, expenseRoutes);
app.use("/api/sales", requireAuth, saleRoutes);
app.use("/api/reports", requireAuth, reportRoutes);
app.get("/", (_, res) => {
    res.json({
        success: true,
        message: "Shop API Running 🚀"
    });
});
export default app;
