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

/* =====================================================
   🆕 NEW — Get submissions grouped by task
===================================================== */
const getSubmissionsGroupedByTask = async () => {
  const submissions = await Deliverable.aggregate([
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$taskId",
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
      $project: {
        _id: 0,
        taskId: 1,
        submittedById: 1,
        submittedByName: 1,
        createdAt: 1,
        rating: 1,
        ratedById: 1,
        ratedByName: 1,
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
===================================================== */
const rateDeliverable = async (deliverableId, rating, rater) => {
  const deliverable = await Deliverable.findById(deliverableId);

  if (!deliverable) {
    throw new Error("Deliverable not found");
  }

  let finalRating = rating;

  // ⭐ إذا ضغط نفس التقييم → نقص واحد
  if (deliverable.rating === rating) {
    finalRating = Math.max(rating - 1, 1);
  }

  deliverable.rating = finalRating;
  deliverable.ratedById = rater.id;
  deliverable.ratedByName = rater.name || rater.username || "Admin";
  deliverable.ratedAt = new Date();

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
