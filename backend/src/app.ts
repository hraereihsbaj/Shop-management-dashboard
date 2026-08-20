import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import productRoutes from "./modules/products/product.routes.js";
import expenseRoutes from "./modules/expenses/expense.routes.js";
import saleRoutes from "./modules/sales/sale.routes.js";
import reportRoutes from "./modules/reports/report.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import { requireAuth } from "./middleware/auth.middleware.js";

const app = express();

// Clean up the frontend URL (remove whitespace and trailing slashes)
let frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").trim();
if (frontendUrl.endsWith('/')) {
  frontendUrl = frontendUrl.slice(0, -1);
}

app.use(cors({
  origin: [frontendUrl, "http://localhost:5173"], // Always allow local dev for convenience
  credentials: true,
}));
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login requests per windowMs
  message: {
    success: false,
    message: "Too many login attempts from this IP, please try again after 15 minutes"
  }
});

app.use("/api/auth", loginLimiter, authRoutes);

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