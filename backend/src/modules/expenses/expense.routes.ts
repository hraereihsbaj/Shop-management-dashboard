import { Router } from "express";
import { 
  createExpense, 
  getExpenses, 
  getExpenseById, 
  updateExpense, 
  deleteExpense,
  uploadExpenses
} from "./expense.controller.js";
import { upload } from "../../middleware/upload.middleware.js";

const router = Router();

router.post("/", createExpense);
router.post("/upload", upload.single("file"), uploadExpenses);
router.get("/", getExpenses);
router.get("/:id", getExpenseById);
router.patch("/:id", updateExpense);
router.delete("/:id", deleteExpense);

export default router;