const authService = require("../services/auth.service");
const User = require("../models/User");
/* =========================
   LOGIN
   POST /auth/login
========================= */
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Missing credentials" });
  }

  try {
    const result = await authService.login(email, password);

    if (!result) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const { accessToken, refreshToken, user } = result;
    const isProd = process.env.NODE_ENV === "production";

    // 🔐 Access Token (HttpOnly)
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 15 * 60 * 1000, // 15 min
    });

    // 🔐 Refresh Token (HttpOnly)
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // نعيد فقط المستخدم (بدون توكن)
    res.json({ user });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed" });
  }
};

/* =========================
   REFRESH TOKEN
   POST /auth/refresh
========================= */
const refreshToken = async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    return res.status(401).json({ message: "Missing refresh token" });
  }

  try {
    const newAccessToken = await authService.refreshToken(token);

    if (!newAccessToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const isProd = process.env.NODE_ENV === "production";

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 15 * 60 * 1000,
    });

    res.json({ message: "Token refreshed" });
  } catch (err) {
    console.error("Refresh token error:", err);
    res.status(500).json({ message: "Failed to refresh token" });
  }
};

/* =========================
   LOGOUT
   POST /auth/logout
========================= */
const logout = async (req, res) => {
  try {
    const isProd = process.env.NODE_ENV === "production";

    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
    });

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ message: "Logout failed" });
  }
};

/* =========================
   GET CURRENT USER
   (يُستخدم عبر authenticateToken)
========================= */
const getMe = async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (err) {
    console.error("Get me error:", err);
    res.status(500).json({ message: "Failed to get user" });
  }
};
/* =========================
   SAVE PUSH SUBSCRIPTION
   POST /auth/subscribe
========================= */
const subscribe = async (req, res) => {
  try {
    const { subscription } = req.body;
    
    // سحب المعرف من req.user (الذي يأتي من verifyToken middleware)
    const userId = req.user.id;

    if (!subscription) {
      return res.status(400).json({ message: "Subscription is required" });
    }

    // تحديث المستخدم وحفظ الاشتراك
    await User.updateOne(
      { id: userId }, 
      { $set: { pushSubscription: subscription } } // نخزنه كـ Object مباشرة
    );

    res.status(200).json({ message: "Push subscription saved ✅" });
  } catch (error) {
    console.error("Error saving subscription:", error);
    res.status(500).json({ message: "Failed to save subscription" });
  }
};
module.exports = {
  login,
  refreshToken,
  logout,
  getMe,
  subscribe,
};
