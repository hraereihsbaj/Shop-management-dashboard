import { Router } from "express";
import { createProduct, getProducts, getProductById, updateProduct, deleteProduct, uploadProducts, getProductHistory } from "./product.controller.js";
import { upload } from "../../middleware/upload.middleware.js";
const router = Router();
router.post("/", createProduct);
router.post("/upload", upload.single("file"), uploadProducts);
router.get("/", getProducts);
router.get("/:id", getProductById); // <-- New
router.get("/:id/history", getProductHistory);
router.patch("/:id", updateProduct); // <-- New
router.delete("/:id", deleteProduct); // <-- New
export default router;
