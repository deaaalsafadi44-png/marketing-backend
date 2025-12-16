require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser"); // ✅ NEW

// Routes
const authRoutes = require("./routes/auth.routes");
const usersRoutes = require("./routes/users.routes");
const tasksRoutes = require("./routes/tasks.routes");
const optionsRoutes = require("./routes/options.routes");
const settingsRoutes = require("./routes/settings.routes");
const reportsRoutes = require("./routes/reports.routes");

const app = express();

/* =========================
   CORS
========================= */
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://marketing-frontend.onrender.com",
      "https://marketing-frontend-e1c3.onrender.com",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("*", cors());
app.use(express.json());
app.use(cookieParser()); // ✅ NEW (مهم لقراءة HttpOnly Cookies)

/* =========================
   SAFETY
========================= */
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

/* =========================
   ROOT
========================= */
app.get("/", (req, res) => {
  res.send("Backend is running ✔");
});

/* =========================
   ROUTES
========================= */
app.use(authRoutes);
app.use(usersRoutes);
app.use(tasksRoutes);
app.use(optionsRoutes);
app.use(settingsRoutes);
app.use(reportsRoutes);

/* =========================
   START SERVER
========================= */
mongoose
  .connect(process.env.MONGO_URI, {
    dbName: "marketing_task_system",
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => {
    console.log("MongoDB Atlas connected ✔");
    app.listen(5000, () =>
      console.log("Server running on port 5000")
    );
  })
  .catch((err) => {
    console.error("MongoDB error:", err.message);
  });
