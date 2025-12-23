router.post("/cloudinary-test", async (req, res) => {
  try {
    const file = req.files?.[0];
    if (!file) return res.status(400).json({ msg: "No file" });

    const result = await uploadToCloudinary(file);
    res.json(result);
  } catch (err) {
    console.error("TEST CLOUDINARY ERROR:", err);
    res.status(500).json(err);
  }
});
