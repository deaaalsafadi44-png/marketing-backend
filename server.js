require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const morgan = require("morgan")

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
app.set("trust proxy", 1); // ✅ مهم جدًا مع HTTPS + Cookies

/* =========================
   🌍 CORS (Frontend ↔ Backend)
========================= */
const allowedOrigins = [
  "http://localhost:5173",
  "https://marketing-frontend.onrender.com",
  "https://marketing-frontend-e1c3.onrender.com",
];
app.use(morgan("tiny"))
app.use(
  cors({
    origin: function (origin, callback) {
      // السماح للـ Postman / SSR
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(
          new Error("CORS not allowed for this origin"),
          false
        );
      }
    },
    credentials: true, // ✅ ضروري للكوكيز
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(cookieParser()); // ✅ ضروري لقراءة HttpOnly Cookies

/* =========================
   🧯 SAFETY
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
    app.listen(PORT, () =>
      console.log(`Server running on port ${PORT}`)
    );
  })
  .catch((err) => {
    console.error("MongoDB error:", err.message);
  });
