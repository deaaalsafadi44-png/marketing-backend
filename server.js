const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();
app.use(cors());
app.use(express.json());

// =========================
// FILE PATHS
// =========================
const usersFile = path.join(__dirname, "database", "users.json");
const tasksFile = path.join(__dirname, "database", "tasks.json");
const optionsFile = path.join(__dirname, "database", "options.json");
const systemSettingsFile = path.join(__dirname, "database", "systemSettings.json");

// =========================
// HELPERS
// =========================
const readJSON = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return [];
  }
};

const writeJSON = (file, data) => {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

// =========================
// JWT CONFIG
// =========================
const ACCESS_SECRET = "ACCESS_SECRET_KEY_123";
const REFRESH_SECRET = "REFRESH_SECRET_KEY_456";

const ACCESS_EXPIRE = "15m";
const REFRESH_EXPIRE = "7d";

// =========================
// GENERATE TOKENS
// =========================
function generateAccessToken(user) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      dept: user.dept,
    },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRE }
  );
}

function generateRefreshToken(user) {
  return jwt.sign({ id: user.id }, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRE,
  });
}

// =========================
// LOGIN
// =========================
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const users = readJSON(usersFile);
  const user = users.find((u) => u.email === email);

  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ message: "Invalid credentials" });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshToken = refreshToken;
  writeJSON(usersFile, users);

  res.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      dept: user.dept,
    },
  });
});

// =========================
// REFRESH TOKEN
// =========================
app.post("/refresh", (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken)
    return res.status(401).json({ message: "Missing refresh token" });

  const users = readJSON(usersFile);
  const user = users.find((u) => u.refreshToken === refreshToken);

  if (!user)
    return res.status(401).json({ message: "Invalid refresh token" });

  jwt.verify(refreshToken, REFRESH_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Expired refresh token" });

    const newAccessToken = generateAccessToken(user);
    res.json({ accessToken: newAccessToken });
  });
});

// =========================
// LOGOUT
// =========================
app.post("/logout", (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken)
    return res.status(400).json({ message: "Missing refresh token" });

  const users = readJSON(usersFile);

  const updated = users.map((u) =>
    u.refreshToken === refreshToken ? { ...u, refreshToken: null } : u
  );

  writeJSON(usersFile, updated);

  res.json({ message: "Logged out successfully" });
});

// =========================
// AUTH
// =========================
function authenticateToken(req, res, next) {
  const header = req.headers["authorization"];
  if (!header) return res.status(401).json({ message: "Missing token" });

  const token = header.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Invalid token format" });

  jwt.verify(token, ACCESS_SECRET, (err, user) => {
    if (err) return res.status(401).json({ message: "Expired access token" });

    req.user = user;
    next();
  });
}

function authorize(roles = []) {
  return (req, res, next) => {
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}

// =========================
// USERS CRUD
// =========================
app.get("/users", authenticateToken, authorize(["Admin"]), (req, res) => {
  res.json(readJSON(usersFile));
});

app.post("/users", authenticateToken, authorize(["Admin"]), async (req, res) => {
  const users = readJSON(usersFile);

  if (users.some((u) => u.email === req.body.email)) {
    return res.status(400).json({ message: "Email already exists" });
  }

  const hashedPassword = await bcrypt.hash(req.body.password, 10);

  const newUser = {
    id: Date.now(),
    name: req.body.name,
    email: req.body.email,
    password: hashedPassword,
    role: req.body.role,
    dept: req.body.dept,
    createdAt: new Date().toISOString(),
    refreshToken: null,
  };

  users.push(newUser);
  writeJSON(usersFile, users);

  res.json(newUser);
});

app.get("/users/:id", authenticateToken, authorize(["Admin"]), (req, res) => {
  const users = readJSON(usersFile);
  const user = users.find((u) => u.id == req.params.id);

  if (!user) return res.status(404).json({ message: "User not found" });

  res.json(user);
});

app.put("/users/:id", authenticateToken, authorize(["Admin"]), async (req, res) => {
  const users = readJSON(usersFile);
  const id = Number(req.params.id);

  let newPassword = null;

  if (req.body.password && req.body.password.trim() !== "") {
    newPassword = await bcrypt.hash(req.body.password, 10);
  }

  const updatedUsers = users.map((u) =>
    u.id === id
      ? {
          ...u,
          name: req.body.name,
          email: req.body.email,
          role: req.body.role,
          dept: req.body.dept,
          password: newPassword ? newPassword : u.password,
        }
      : u
  );

  writeJSON(usersFile, updatedUsers);

  res.json({ message: "User updated successfully" });
});

app.delete("/users/:id", authenticateToken, authorize(["Admin"]), (req, res) => {
  const users = readJSON(usersFile);

  writeJSON(
    usersFile,
    users.filter((u) => u.id != req.params.id)
  );

  res.json({ message: "User deleted" });
});

// =========================
// TASKS CRUD
// =========================
app.get("/tasks", authenticateToken, (req, res) => {
  const tasks = readJSON(tasksFile);

  if (req.user.role === "Employee") {
    const filtered = tasks.filter((t) => t.workerId == req.user.id);
    return res.json(filtered);
  }

  res.json(tasks);
});

app.get("/tasks/:id", authenticateToken, (req, res) => {
  const tasks = readJSON(tasksFile);
  const task = tasks.find((t) => t.id == req.params.id);

  if (!task) return res.status(404).json({ message: "Task not found" });

  res.json(task);
});

app.post("/tasks", authenticateToken, authorize(["Admin"]), (req, res) => {
  const tasks = readJSON(tasksFile);
  const users = readJSON(usersFile);

  const worker = users.find((u) => u.id == req.body.workerId);

  const newTask = {
    id: Date.now(),
    ...req.body,
    workerName: worker?.name || "Unknown",
    createdAt: new Date().toISOString(),
  };

  tasks.push(newTask);
  writeJSON(tasksFile, tasks);

  res.json(newTask);
});

app.put("/tasks/:id", authenticateToken, (req, res) => {
  const tasks = readJSON(tasksFile);
  const users = readJSON(usersFile);
  const id = Number(req.params.id);

  const task = tasks.find((t) => t.id === id);
  if (!task) return res.status(404).json({ message: "Task not found" });

  if (req.user.role === "Employee") {
    if (!req.body.status)
      return res.status(400).json({ message: "Status is required" });

    task.status = req.body.status;
    writeJSON(tasksFile, tasks);

    return res.json({ message: "Status updated successfully" });
  }

  const worker = users.find((u) => u.id == req.body.workerId);

  const updated = tasks.map((t) =>
    t.id === id
      ? { ...t, ...req.body, workerName: worker?.name || t.workerName }
      : t
  );

  writeJSON(tasksFile, updated);

  res.json({ message: "Task updated successfully" });
});

app.delete("/tasks/:id", authenticateToken, authorize(["Admin"]), (req, res) => {
  const tasks = readJSON(tasksFile);

  writeJSON(
    tasksFile,
    tasks.filter((t) => t.id != req.params.id)
  );

  res.json({ message: "Task deleted" });
});

// =========================
// OPTIONS CRUD
// =========================
app.get("/options", authenticateToken, (req, res) => {
  res.json(readJSON(optionsFile));
});

app.put("/options", authenticateToken, authorize(["Admin"]), (req, res) => {
  writeJSON(optionsFile, req.body);
  res.json({ message: "Options updated successfully" });
});

// =========================
// UPDATE TASK TIME
// =========================
app.put("/tasks/:id/time", authenticateToken, (req, res) => {
  const tasks = readJSON(tasksFile);
  const id = Number(req.params.id);

  const task = tasks.find((t) => t.id === id);
  if (!task) return res.status(404).json({ message: "Task not found" });

  const { timeSpent } = req.body;
  if (timeSpent == null) {
    return res.status(400).json({ message: "timeSpent is required" });
  }

  task.timeSpent = (task.timeSpent || 0) + Number(timeSpent);

  writeJSON(tasksFile, tasks);

  res.json({ message: "Time added successfully", timeSpent: task.timeSpent });
});

// =========================
// SYSTEM SETTINGS API  (NEW)
// =========================

// GET SETTINGS
app.get("/settings", authenticateToken, authorize(["Admin"]), (req, res) => {
  const settings = readJSON(systemSettingsFile);
  res.json(settings);
});

// UPDATE SETTINGS (Admin only)
app.put("/settings", authenticateToken, authorize(["Admin"]), (req, res) => {
  writeJSON(systemSettingsFile, req.body);
  res.json({ message: "Settings updated successfully" });
});

// =========================
// START SERVER
// =========================
app.listen(5000, () =>
  console.log("🚀 JWT + Refresh Token Server running on http://localhost:5000")
);
