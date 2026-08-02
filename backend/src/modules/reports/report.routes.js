import { Router } from "express";
import { getProfitReport, getChartData } from "./report.controller.js";
const router = Router();
router.get("/profit", getProfitReport);
router.get("/chart", getChartData);
export default router;
