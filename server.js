// server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

// Routes (⚠️ استيراد صريح بالامتداد .js)
const authRoutes = require("./routes/auth.routes.js");
const usersRoutes = require("./routes/users.routes.js");
const tasksRoutes = require("./routes/tasks.routes.js");
const optionsRoutes = require("./routes/options.routes.js");
const settingsRoutes = require("./routes/settings.routes.js");
const reportsRoutes = require("./routes/reports.routes.js");
const deliverablesRoutes = require("./routes/deliverables.routes.js");

// ✅ Cloudinary test route
const cloudinaryTestRoutes = require("./routes/cloudinaryTest.js");

const app = express();

/* TRUST PROXY */
app.set("trust proxy", 1);

/* CORS */
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://marketing-frontend.onrender.com",
  "https://marketing-frontend-e1c3.onrender.com",
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.options("*", cors());

app.use(morgan("tiny"));
app.use(express.json());
app.use(cookieParser());

/* ROOT */
app.get("/", (req, res) => {
  res.send("Backend is running ✔");
});

/* ROUTES */
app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("/tasks", tasksRoutes);
app.use("/options", optionsRoutes);
app.use("/settings", settingsRoutes);
app.use("/reports", reportsRoutes);
app.use("/deliverables", deliverablesRoutes);

// ✅ Cloudinary test endpoint
app.use("/test", cloudinaryTestRoutes);

/* START SERVER */
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI, { dbName: "marketing_task_system" })
  .then(() => {
    console.log("MongoDB connected ✔");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB error:", err.message);
  });
