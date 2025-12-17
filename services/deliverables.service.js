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

  // Return plain object without Mongo _id
  const { _id, ...plain } = saved.toObject();
  return plain;
};

/*
  Get all deliverables
  Used for the page that shows boxes
*/
const getAllDeliverables = async () => {
  return Deliverable.find({}, { _id: 0 }).sort({ createdAt: -1 });
};

module.exports = {
  createDeliverable,
  getAllDeliverables,
};
