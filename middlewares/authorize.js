module.exports = (roles = []) => (req, res, next) => {
  if (!req.user || !req.user.role) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // 🔹 توحيد صيغة الـ role
  const userRole = req.user.role.toLowerCase();
  const allowedRoles = roles.map(role => role.toLowerCase());

  console.log({
    allowedRoles,
    userRole,
  });

  if (allowedRoles.length && !allowedRoles.includes(userRole)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  next();
};
