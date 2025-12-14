require("dotenv").config();

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const app = express();
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://marketing-frontend.onrender.com"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.options("*", cors());
app.use(express.json());

// =========================
// SAFETY
// =========================
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

// =========================
// ROOT
// =========================
app.get("/", (req, res) => {
  res.send("Backend is running ✔");
});

// =========================
// SCHEMAS
// =========================
const UserSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  name: String,
  email: String,
  password: String,
  role: String,
  dept: String,
  createdAt: String,
  refreshToken: String,
}, { versionKey: false });

const TaskSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  title: String,
  description: String,
  priority: String,
  status: String,
  company: String,
  workerId: Number,
  workerName: String,
  timeSpent: Number,
  createdAt: String,
}, { versionKey: false });

const OptionsSchema = new mongoose.Schema({
  priority: Array,
  status: Array,
  companies: Array,
}, { versionKey: false });

const SettingsSchema = new mongoose.Schema({}, {
  strict: false,
  versionKey: false
});

const User = mongoose.model("User", UserSchema);
const Task = mongoose.model("Task", TaskSchema);
const Options = mongoose.model("Options", OptionsSchema);
const SystemSettings = mongoose.model("SystemSettings", SettingsSchema);

// =========================
// JWT
// =========================
const ACCESS_SECRET = "ACCESS_SECRET_KEY_123";
const REFRESH_SECRET = "REFRESH_SECRET_KEY_456";

const generateAccessToken = (user) =>
  jwt.sign({
    id: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    dept: user.dept,
  }, ACCESS_SECRET, { expiresIn: "15m" });

const generateRefreshToken = (user) =>
  jwt.sign({ id: user.id }, REFRESH_SECRET, { expiresIn: "7d" });

// =========================
// AUTH MIDDLEWARE
// =========================
function authenticateToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: "Missing token" });

  const token = header.split(" ")[1];
  jwt.verify(token, ACCESS_SECRET, (err, user) => {
    if (err) return res.status(401).json({ message: "Expired token" });
    req.user = user;
    next();
  });
}

const authorize = (roles = []) => (req, res, next) => {
  if (roles.length && !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};

// =========================
// BOOTSTRAP ADMIN
// =========================
const createAdminIfNotExists = async () => {
  const admin = await User.findOne({ role: "Admin" });
  if (admin) {
    console.log("👤 Admin already exists");
    return;
  }

  const id = Math.floor(Date.now() / 1000);

  await User.create({
    id,
    name: "Admin",
    email: "admin@mail.com",
    password: await bcrypt.hash("123456", 10),
    role: "Admin",
    dept: "Management",
    createdAt: new Date().toISOString(),
    refreshToken: null,
  });

  console.log("✅ Admin created automatically");
};

// =========================
// AUTH
// =========================
app.post("/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(req.body.password, user.password);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const refreshToken = generateRefreshToken(user);
  user.refreshToken = refreshToken;
  await user.save();

  res.json({
    accessToken: generateAccessToken(user),
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      dept: user.dept,
    }
  });
});

app.post("/refresh", async (req, res) => {
  const user = await User.findOne({ refreshToken: req.body.refreshToken });
  if (!user) return res.status(401).json({ message: "Invalid refresh token" });

  jwt.verify(req.body.refreshToken, REFRESH_SECRET, (err) => {
    if (err) return res.status(403).json({ message: "Expired refresh token" });
    res.json({ accessToken: generateAccessToken(user) });
  });
});

app.post("/logout", async (req, res) => {
  await User.updateOne({ refreshToken: req.body.refreshToken }, { refreshToken: null });
  res.json({ message: "Logged out successfully" });
});

// =========================
// USERS
// =========================
app.post("/users", authenticateToken, authorize(["Admin"]), async (req, res) => {
  if (await User.findOne({ email: req.body.email })) {
    return res.status(400).json({ message: "Email already exists" });
  }

  const id = Math.floor(Date.now() / 1000);

  const user = {
    id,
    name: req.body.name,
    email: req.body.email,
    password: await bcrypt.hash(req.body.password, 10),
    role: req.body.role,
    dept: req.body.department || req.body.dept || "",
    createdAt: new Date().toISOString(),
    refreshToken: null,
  };

  await User.create(user);
  res.json(user);
});

app.get("/users", authenticateToken, authorize(["Admin"]), async (req, res) => {
  res.json(await User.find({}, { _id: 0 }));
});

// ✅ GET USER BY ID
app.get("/users/:id", authenticateToken, authorize(["Admin"]), async (req, res) => {
  const user = await User.findOne({ id: Number(req.params.id) }, { _id: 0 });
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});

// ✅ UPDATE USER
app.put("/users/:id", authenticateToken, authorize(["Admin"]), async (req, res) => {
  if (req.body.password) {
    req.body.password = await bcrypt.hash(req.body.password, 10);
  } else {
    delete req.body.password;
  }

  const updated = await User.findOneAndUpdate(
    { id: Number(req.params.id) },
    req.body,
    { new: true, projection: { _id: 0 } }
  );

  if (!updated) return res.status(404).json({ message: "User not found" });
  res.json(updated);
});

// =========================
// TASKS
// =========================
app.post("/tasks", authenticateToken, authorize(["Admin"]), async (req, res) => {
  const worker = await User.findOne({ id: req.body.workerId });

  const task = {
    id: Math.floor(Date.now() / 1000),
    ...req.body,
    workerName: worker?.name || "Unknown",
    createdAt: new Date().toISOString(),
  };

  await Task.create(task);
  res.json(task);
});

app.get("/tasks", authenticateToken, async (req, res) => {
  if (req.user.role === "Employee") {
    return res.json(await Task.find({ workerId: req.user.id }, { _id: 0 }));
  }
  res.json(await Task.find({}, { _id: 0 }));
});

// ✅ GET TASK BY ID
app.get("/tasks/:id", authenticateToken, async (req, res) => {
  const task = await Task.findOne({ id: Number(req.params.id) }, { _id: 0 });
  if (!task) return res.status(404).json({ message: "Task not found" });
  res.json(task);
});

// ✅ UPDATE TASK
app.put("/tasks/:id", authenticateToken, async (req, res) => {
  const updated = await Task.findOneAndUpdate(
    { id: Number(req.params.id) },
    req.body,
    { new: true, projection: { _id: 0 } }
  );
  if (!updated) return res.status(404).json({ message: "Task not found" });
  res.json(updated);
});

// ✅ SAVE TIME
app.put("/tasks/:id/time", authenticateToken, async (req, res) => {
  const updated = await Task.findOneAndUpdate(
    { id: Number(req.params.id) },
    { timeSpent: req.body.timeSpent },
    { new: true, projection: { _id: 0 } }
  );
  if (!updated) return res.status(404).json({ message: "Task not found" });
  res.json(updated);
});

// =========================
// OPTIONS
// =========================
app.get("/options", authenticateToken, async (req, res) => {
  res.json((await Options.findOne({}, { _id: 0 })) || {
    priority: [],
    status: [],
    companies: [],
  });
});

app.put("/options", authenticateToken, authorize(["Admin"]), async (req, res) => {
  await Options.deleteMany({});
  await Options.create(req.body);
  res.json({ message: "Options saved" });
});

// =========================
// SETTINGS
// =========================
app.get("/settings", authenticateToken, authorize(["Admin"]), async (req, res) => {
  res.json((await SystemSettings.findOne({}, { _id: 0 })) || {});
});

// =========================
// START SERVER
// =========================
mongoose.connect(process.env.MONGO_URI, {
  dbName: "marketing_task_system",
  serverSelectionTimeoutMS: 5000,
})
.then(async () => {
  console.log("MongoDB Atlas connected ✔");
  await createAdminIfNotExists();
  app.listen(5000, () => console.log("Server running on port 5000"));
})
.catch(err => {
  console.error("MongoDB error:", err.message);
});
