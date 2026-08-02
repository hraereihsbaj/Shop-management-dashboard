import type { Request, Response } from "express";
import * as reportService from "./report.service.js";

export async function getProfitReport(req: Request, res: Response) {
  try {
    const month = req.query.month ? parseInt(req.query.month as string) : undefined;
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    const date = req.query.date ? (req.query.date as string) : undefined;

    const report = await reportService.getProfitAndLoss(month, year, date);
    
    res.status(200).json({
      success: true,
      message: "Profit & Loss generated successfully",
      data: report
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to generate report"
    });
  }
}

export async function getChartData(req: Request, res: Response) {
  try {
    const period = (req.query.period as string) || 'week';
    const data = await reportService.getChartData(period);
    
    res.status(200).json({
      success: true,
      data
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to generate chart data"
    });
  }
}