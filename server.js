// server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

// Routes
const authRoutes = require("./routes/auth.routes");
const usersRoutes = require("./routes/users.routes");
const tasksRoutes = require("./routes/tasks.routes");
const optionsRoutes = require("./routes/options.routes");
const settingsRoutes = require("./routes/settings.routes");
const reportsRoutes = require("./routes/reports.routes");
const deliverablesRoutes = require("./routes/deliverables.routes");

const app = express();

/* =========================
   TRUST PROXY (Render)
========================= */
app.set("trust proxy", 1);

/* =========================
   🔥 CORS (FINAL – DO NOT TOUCH)
========================= */
app.use(
  cors({
    origin: true,        // ✅ يعكس الـ origin القادم
    credentials: true,   // ✅ يسمح بالكوكيز
  })
);

// ✅ ضروري جدًا لـ preflight (OPTIONS)
app.options("*", cors());

/* =========================
   MIDDLEWARES
========================= */
app.use(morgan("tiny"));
app.use(express.json());
app.use(cookieParser());

/* =========================
   ROOT
========================= */
app.get("/", (req, res) => {
  res.send("Backend is running ✔");
});

/* =========================
   ROUTES
========================= */
app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("/tasks", tasksRoutes);
app.use("/options", optionsRoutes);
app.use("/settings", settingsRoutes);
app.use("/reports", reportsRoutes);
app.use("/deliverables", deliverablesRoutes);

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI, {
    dbName: "marketing_task_system",
  })
  .then(() => {
    console.log("MongoDB connected ✔");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB error:", err.message);
  });
