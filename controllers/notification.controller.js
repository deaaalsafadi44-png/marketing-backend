const Notification = require("../models/Notification");

// 1. جلب كل إشعارات المستخدم (للعرض في القائمة)
const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id; // نعتمد على معرف المستخدم من التوكن
    const notifications = await Notification.find({ recipientId: userId })
      .sort({ createdAt: -1 }) // الأحدث أولاً
      .limit(20); // جلب آخر 20 إشعاراً فقط
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: "خطأ في جلب الإشعارات" });
  }
};

// 2. جلب عدد الإشعارات غير المقروءة (هذا هو محرك العداد في النافبار)
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await Notification.countDocuments({ 
      recipientId: userId, 
      isRead: false 
    });
    res.json({ unreadCount: count });
  } catch (err) {
    res.status(500).json({ message: "خطأ في حساب الإشعارات" });
  }
};

// 3. تحديث الإشعار ليصبح "مقروءاً" (عندما يضغط عليه الموظف)
const markAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    await Notification.findByIdAndUpdate(notificationId, { isRead: true });
    res.json({ message: "تم التحديث" });
  } catch (err) {
    res.status(500).json({ message: "خطأ في تحديث الحالة" });
  }
};

module.exports = {
  getMyNotifications,
  getUnreadCount,
  markAsRead
};