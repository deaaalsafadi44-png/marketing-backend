const authService = require("../services/auth.service");

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

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
};

module.exports = {
  login,
};
