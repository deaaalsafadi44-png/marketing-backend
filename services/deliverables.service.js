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
    taskId: String(taskId), // ✅ توحيد النوع
    submittedById,
    submittedByName,
    notes: notes || "",
    files,
    createdAt: new Date(),
  };

  const saved = await Deliverable.create(deliverable);

  // 🧪 LOG 1: _id موجود بعد الحفظ
  console.log("🧪 [SERVICE:createDeliverable] saved._id =", saved._id);

  // ✅ لا نحذف _id لأننا نحتاجه لربط الملفات
  const plain = saved.toObject();

  // 🧪 LOG 2: تأكيد وجود _id
  console.log("🧪 [SERVICE:createDeliverable] plain._id =", plain._id);

  return plain;
};

/*
  Update deliverable with uploaded files
  ✅ الإضافة الوحيدة اللازمة لربط الملفات
*/
const updateDeliverableFiles = async (deliverableId, files) => {
  // 🧪 LOG 3: ما الذي يصل للدالة
  console.log(
    "🧪 [SERVICE:updateDeliverableFiles] deliverableId =",
    deliverableId
  );
  console.log(
    "🧪 [SERVICE:updateDeliverableFiles] files.length =",
    files?.length
  );

  if (!deliverableId) {
    console.log(
      "❌ [SERVICE:updateDeliverableFiles] NO deliverableId → update skipped"
    );
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
  Used for the page that shows boxes
  ✅ Supports optional taskId filtering
*/
const getAllDeliverables = async (taskId) => {
  const query = taskId ? { taskId: String(taskId) } : {}; // ✅ التعديل المهم
  return Deliverable.find(query).sort({ createdAt: -1 });
};

module.exports = {
  createDeliverable,
  updateDeliverableFiles,
  getAllDeliverables,
};
