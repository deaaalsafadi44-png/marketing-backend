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
    taskId,
    submittedById,
    submittedByName,
    notes: notes || "",
    files,
    createdAt: new Date(),
  };

  const saved = await Deliverable.create(deliverable);

  // ⚠️ نُبقي _id داخليًا للباك فقط
  // لكن لا نُرجعه للواجهة
  const plain = saved.toObject();
  delete plain._id;

  return plain;
};

/*
  Update deliverable with uploaded files
  ✅ الإضافة الوحيدة اللازمة لربط الملفات
*/
const updateDeliverableFiles = async (deliverableId, files) => {
  if (!deliverableId) return;

  await Deliverable.updateOne(
    { _id: deliverableId },
    { $push: { files: { $each: files } } }
  );
};

/*
  Get all deliverables
  Used for the page that shows boxes
  ✅ Supports optional taskId filtering
*/
const getAllDeliverables = async (taskId) => {
  const query = taskId ? { taskId: Number(taskId) } : {};
  return Deliverable.find(query, { _id: 0 }).sort({ createdAt: -1 });
};

module.exports = {
  createDeliverable,
  updateDeliverableFiles, // ✅ export الدالة الجديدة
  getAllDeliverables,
};
