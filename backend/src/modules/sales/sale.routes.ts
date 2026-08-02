import { Router } from "express";
import { createSale, getSales, deleteSale, updateSale, uploadSales } from "./sale.controller.js";
import { upload } from "../../middleware/upload.middleware.js";

const router = Router();

router.post("/", createSale);
router.post("/upload", upload.single("file"), uploadSales);
router.get("/", getSales);
router.delete("/:id", deleteSale);
router.patch("/:id", updateSale);

export default router;