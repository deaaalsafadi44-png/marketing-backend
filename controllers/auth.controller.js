const authService = require("../services/auth.service");

/* =========================
   LOGIN (HttpOnly Cookies)
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

    // Access Token (قصير)
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    // Refresh Token (طويل)
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // نعيد فقط المستخدم (بدون توكنات)
    res.json({ user });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed" });
  }
};

/* =========================
   REFRESH TOKEN (HttpOnly)
========================= */
const refreshToken = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: "Missing refresh token" });
  }

  try {
    const newAccessToken = await authService.refreshToken(refreshToken);

    if (!newAccessToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    res.json({ message: "Token refreshed" });
  } catch (err) {
    console.error("Refresh token error:", err);
    res.status(500).json({ message: "Failed to refresh token" });
  }
};

/* =========================
   LOGOUT (HttpOnly Cookies)
========================= */
const logout = async (req, res) => {
  try {
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ message: "Logout failed" });
  }
};

/* =========================
   GET CURRENT USER (auth/me)
========================= */
const getMe = async (req, res) => {
  try {
    // req.user يأتي من authenticateToken
    res.json({
      user: req.user,
    });
  } catch (err) {
    console.error("Get me error:", err);
    res.status(500).json({ message: "Failed to get user" });
  }
};

module.exports = {
  login,
  refreshToken,
  logout,
  getMe, // ✅ NEW
};
