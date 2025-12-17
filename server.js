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

const app = express();

/* =========================
   🛡 TRUST PROXY (Render)
========================= */
app.set("trust proxy", 1);

/* =========================
   🌍 CORS CONFIG
========================= */
const allowedOrigins = [
  "http://localhost:5173",
  "https://marketing-frontend.onrender.com",
  "https://marketing-frontend-e1c3.onrender.com",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // السماح للـ Postman / Server-to-Server
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // ❌ لا ترمي Error (تسبب فشل preflight)
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// مهم جدًا للـ preflight
app.options("*", cors());

/* =========================
   🧰 MIDDLEWARES
========================= */
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

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

/* =========================
   🧯 GLOBAL ERROR HANDLER
========================= */
app.use((err, req, res, next) => {
  console.error("🔥 Error:", err.message);
  res.status(500).json({
    message: "Internal server error",
  });
});

/* =========================
   🚀 START SERVER
========================= */
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI, {
    dbName: "marketing_task_system",
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => {
    console.log("MongoDB Atlas connected ✔");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
  });
