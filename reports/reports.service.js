const Task = require("../models/Task");

/* =========================
   REPORTS SUMMARY (WITH FILTERS)
   =========================
   - totalTasks
   - totalMinutes
   - mostCommonTask
*/
const getSummaryReport = async (filters = {}) => {
  const matchStage = {};

  /* =========================
     COMPANY FILTER
  ========================= */
  if (filters.company) {
    matchStage.company = filters.company;
  }

  /* =========================
     DATE FILTERS
  ========================= */
  if (filters.dateFrom || filters.dateTo) {
    matchStage.createdAt = {};

    if (filters.dateFrom) {
      matchStage.createdAt.$gte = new Date(filters.dateFrom + "T00:00:00");
    }

    if (filters.dateTo) {
      matchStage.createdAt.$lte = new Date(filters.dateTo + "T23:59:59");
    }
  }

  const result = await Task.aggregate([
    { $match: matchStage },
    {
  // داخل ملف reports.service.js في الـ aggregate
$group: {
  _id: null,
  totalTasks: { $sum: 1 },
  totalMinutes: { 
    $sum: { 
      $add: [
        { $ifNull: ["$timeSpent", 0] },
        { $divide: [{ $ifNull: ["$timer.totalSeconds", 0] }, 60] } // تحويل الثواني لدقائق
      ]
    } 
  },
  types: { $push: "$type" },
}
    },
  ]);

  if (result.length === 0) {
    return {
      totalTasks: 0,
      totalMinutes: 0,
      mostCommonTask: "—",
    };
  }

  /* =========================
     MOST COMMON TASK TYPE
  ========================= */
  const typeCounts = {};
  result[0].types.forEach((type) => {
    if (!type) return;
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });

  const mostCommonTask =
    Object.keys(typeCounts).length > 0
      ? Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0][0]
      : "—";

  return {
    totalTasks: result[0].totalTasks,
    totalMinutes: result[0].totalMinutes,
    mostCommonTask,
  };
};

module.exports = {
  getSummaryReport,
};
