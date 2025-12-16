const reportsService = require("./reports.service");

/* =========================
   REPORTS SUMMARY
   =========================
   GET /reports/summary
   Query params:
   - company
   - dateFrom
   - dateTo
*/
const getSummaryReport = async (req, res) => {
  try {
    const { company, dateFrom, dateTo } = req.query;

    const summary = await reportsService.getSummaryReport({
      company,
      dateFrom,
      dateTo,
    });

    res.json({
      totalTasks: summary.totalTasks,
      totalMinutes: summary.totalMinutes,
      mostCommonTask: summary.mostCommonTask,
    });
  } catch (err) {
    console.error("Reports summary error:", err);
    res.status(500).json({
      message: "Failed to load reports summary",
    });
  }
};

module.exports = {
  getSummaryReport,
};
