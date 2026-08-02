import * as reportService from "./report.service.js";
export async function getProfitReport(req, res) {
    try {
        const month = req.query.month ? parseInt(req.query.month) : undefined;
        const year = req.query.year ? parseInt(req.query.year) : undefined;
        const date = req.query.date ? req.query.date : undefined;
        const report = await reportService.getProfitAndLoss(month, year, date);
        res.status(200).json({
            success: true,
            message: "Profit & Loss generated successfully",
            data: report
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to generate report"
        });
    }
}
export async function getChartData(req, res) {
    try {
        const period = req.query.period || 'week';
        const data = await reportService.getChartData(period);
        res.status(200).json({
            success: true,
            data
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to generate chart data"
        });
    }
}
