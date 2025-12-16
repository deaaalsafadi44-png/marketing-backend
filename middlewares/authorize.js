module.exports = (roles = []) => (req, res, next) => {
    console.log({
        roles,
        userRole: req.user.role
    })
  if (roles.length && !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};
