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

module.exports = {
  createDeliverable,
  updateDeliverableFiles,
  getAllDeliverables,
};
