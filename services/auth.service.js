const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const ACCESS_SECRET = process.env.ACCESS_SECRET || "ACCESS_SECRET_KEY_123";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "REFRESH_SECRET_KEY_456";

/* =========================
   TOKEN GENERATORS
   ========================= */
const generateAccessToken = (user) =>
  jwt.sign(
    {
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      dept: user.dept,
    },
    ACCESS_SECRET,
    { expiresIn: "15m" }
  );

const generateRefreshToken = (user) =>
  jwt.sign({ id: user.id }, REFRESH_SECRET, { expiresIn: "7d" });

/* =========================
   LOGIN
   ========================= */
const login = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) return null;

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return null;

  const refreshToken = generateRefreshToken(user);
  user.refreshToken = refreshToken;
  await user.save();

  return {
    accessToken: generateAccessToken(user),
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      dept: user.dept,
    },
  };
};

/* =========================
   REFRESH ACCESS TOKEN
   ========================= */
const refreshToken = async (token) => {
  try {
    // 1️⃣ تحقق من صحة التوقيع
    const decoded = jwt.verify(token, REFRESH_SECRET);

    // 2️⃣ تأكد أن التوكن موجود في DB
    const user = await User.findOne({
      id: decoded.id,
      refreshToken: token,
    });

    if (!user) return null;

    // 3️⃣ توليد Access Token جديد فقط
    return generateAccessToken(user);
  } catch (err) {
    return null;
  }
};

module.exports = {
  login,
  refreshToken,
};
