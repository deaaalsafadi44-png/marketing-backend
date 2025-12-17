module.exports = (roles = []) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized - no user" });
  }

  /**
   * 🔍 استخراج الـ role بأمان
   * يدعم:
   * - "admin"
   * - "Admin"
   * - { name: "Manager" }
   * - { role: "manager" }
   */
  let userRole = null;

  if (typeof req.user.role === "string") {
    userRole = req.user.role;
  } else if (typeof req.user.role === "object" && req.user.role !== null) {
    userRole =
      req.user.role.name ||
      req.user.role.role ||
      null;
  }

  if (!userRole) {
    console.log("❌ ROLE NOT FOUND", req.user.role);
    return res.status(403).json({ message: "Forbidden - role missing" });
  }

  // 🔹 توحيد الصيغة (lowercase + trim)
  const normalizedUserRole = userRole.toString().toLowerCase().trim();
  const allowedRoles = roles.map(r => r.toLowerCase().trim());

  // 🧪 DEBUG (مهم للاختبار)
  console.log("AUTHORIZE CHECK 👉", {
    allowedRoles,
    normalizedUserRole,
    originalRole: req.user.role,
  });

  if (allowedRoles.length && !allowedRoles.includes(normalizedUserRole)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  next();
};
