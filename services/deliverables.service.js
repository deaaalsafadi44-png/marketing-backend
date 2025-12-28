const Deliverable = require("../models/Deliverable");

/*
  Create a new deliverable (task submission)
  NOTE: Files will be added later step-by-step
*/
const createDeliverable = async ({
  taskId,
  submittedById,
  submittedByName,
  notes,
  files = [],
}) => {
  const deliverable = {
    taskId: String(taskId),
    submittedById,
    submittedByName,
    notes: notes || "",
    files,
    createdAt: new Date(),
  };

  const saved = await Deliverable.create(deliverable);

  // 🧪 LOG: _id موجود بعد الحفظ
  console.log("🧪 [SERVICE:createDeliverable] saved._id =", saved._id);

  // ✅ لا نحذف _id لأننا نحتاجه لربط الملفات
  return saved.toObject();
};

/*
  Update deliverable with uploaded files
*/
const updateDeliverableFiles = async (deliverableId, files) => {
  console.log("🧪 [SERVICE:updateDeliverableFiles] deliverableId =", deliverableId);
  console.log("🧪 [SERVICE:updateDeliverableFiles] files.length =", files?.length);

  if (!deliverableId) {
    console.log("❌ [SERVICE:updateDeliverableFiles] NO deliverableId → update skipped");
    return;
  }

  await Deliverable.updateOne(
    { _id: deliverableId },
    { $push: { files: { $each: files } } }
  );

  console.log("✅ [SERVICE:updateDeliverableFiles] Mongo update executed");
};

/*
  Get all deliverables
  ✅ Supports optional taskId filtering
*/
const getAllDeliverables = async (taskId) => {
  const query = taskId ? { taskId: String(taskId) } : {};
  return Deliverable.find(query).sort({ createdAt: -1 });
};

/* =====================================================
   ✅ NEW — Get deliverable by ID
===================================================== */
const getDeliverableById = async (deliverableId) => {
  return Deliverable.findById(deliverableId);
};

/* =====================================================
   ✅ NEW — Remove file from deliverable
===================================================== */
const removeFileFromDeliverable = async (deliverableId, fileId) => {
  await Deliverable.updateOne(
    { _id: deliverableId },
    { $pull: { files: { _id: fileId } } }
  );
};

const getSubmissionsGroupedByTask = async () => {
  const submissions = await Deliverable.aggregate([
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$taskId",
        deliverableId: { $first: "$_id" },
        taskId: { $first: "$taskId" },
        submittedById: { $first: "$submittedById" },
        submittedByName: { $first: "$submittedByName" },
        createdAt: { $first: "$createdAt" },
        files: { $push: "$files" },
        rating: { $first: "$rating" },
        ratedById: { $first: "$ratedById" },
        ratedByName: { $first: "$ratedByName" },
      },
    },
    {
      $lookup: {
        from: "tasks", // جرب "tasks" أولاً
        let: { tId: "$taskId" },
        pipeline: [
          { 
            $match: { 
              $expr: { $eq: [{ $toString: "$_id" }, { $toString: "$$tId" }] } 
            } 
          }
        ],
        as: "taskDetails"
      }
    },
    // ✅ في حال فشل الربط مع "tasks"، سنحاول الربط مع "Task" (حرف كبير)
    {
      $lookup: {
        from: "Task", 
        let: { tId: "$taskId" },
        pipeline: [
          { 
            $match: { 
              $expr: { $eq: [{ $toString: "$_id" }, { $toString: "$$tId" }] } 
            } 
          }
        ],
        as: "taskDetailsBackup"
      }
    },
    {
      $addFields: {
        taskDetails: { 
          $ifNull: [
            { $arrayElemAt: ["$taskDetails", 0] }, 
            { $arrayElemAt: ["$taskDetailsBackup", 0] }
          ] 
        }
      }
    },
    {
      $project: {
        _id: 0,
        deliverableId: 1,
        taskId: 1,
        submittedById: 1,
        submittedByName: 1,
        createdAt: 1,
        rating: 1,
        taskDetails: 1, // الآن سيحتوي على العنوان والشركة والتعليقات
        files: {
          $reduce: {
            input: "$files",
            initialValue: [],
            in: { $concatArrays: ["$$value", "$$this"] },
          },
        },
      },
    },
    { $sort: { createdAt: -1 } },
  ]);
  return submissions;
};

/* =====================================================
   ⭐ NEW — Rate Deliverable (Admin / Manager)
   ✅ منطق صحيح 100%
===================================================== */
const rateDeliverable = async (deliverableId, rating, rater) => {
  const deliverable = await Deliverable.findById(deliverableId);

  if (!deliverable) {
    throw new Error("Deliverable not found");
  }

  // ✅ toggle logic الصحيح
  const finalRating = deliverable.rating === rating ? 0 : rating;

  deliverable.rating = finalRating;
  deliverable.ratedById = finalRating ? rater.id : null;
  deliverable.ratedByName = finalRating
    ? rater.name || rater.username || "Admin"
    : null;
  deliverable.ratedAt = finalRating ? new Date() : null;

  await deliverable.save();

  return deliverable;
};

module.exports = {
  createDeliverable,
  updateDeliverableFiles,
  getAllDeliverables,

  // ✅ exports الموجودة
  getDeliverableById,
  removeFileFromDeliverable,
  getSubmissionsGroupedByTask,

  // ⭐ export الجديد
  rateDeliverable,
};
