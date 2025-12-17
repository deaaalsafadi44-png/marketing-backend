require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

const app = express();

/* =========================
   TRUST PROXY (Render)
========================= */
app.set("trust proxy", 1);

/* =========================
   CORS (🔥 مهم جدًا)
========================= */
const allowedOrigins = [
  "http://localhost:5173",
  "https://marketing-frontend.onrender.com",
  "https://marketing-frontend-e1c3.onrender.com",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // يسمح للـ Postman / server calls
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(null, true); // ⚠️ لا تمنع – فقط لا تضف origin
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 🔥 preflight
app.options("*", cors());

/* =========================
   MIDDLEWARES
========================= */
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

/* =========================
   ROUTES
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
   GLOBAL ERROR HANDLER
========================= */
app.use((err, req, res, next) => {
  console.error("🔥 Error:", err);
  res.status(500).json({ message: "Internal server error" });
});

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
    app.listen(PORT, () =>
      console.log(`Server running on port ${PORT}`)
    );
  })
  .catch((err) => console.error(err));