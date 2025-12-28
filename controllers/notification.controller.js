const Notification = require("../models/Notification");

// 1. جلب كل إشعارات المستخدم (للعرض في القائمة)
const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id; 
    const notifications = await Notification.find({ recipientId: userId })
      .sort({ createdAt: -1 }) 
      .limit(20); 
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: "خطأ في جلب الإشعارات" });
  }
};

// 2. جلب عدد الإشعارات غير المقروءة
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

// 3. تحديث الإشعار ليصبح "مقروءاً"
const markAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    await Notification.findByIdAndUpdate(notificationId, { isRead: true });
    res.json({ message: "تم التحديث" });
  } catch (err) {
    res.status(500).json({ message: "خطأ في تحديث الحالة" });
  }
};

// 4. حذف إشعار محدد (الإضافة الجديدة)
const deleteNotification = async (req, res) => {
  try {
    const notificationId = req.params.id;
    
    // البحث عن الإشعار وحذفه
    const deletedNotification = await Notification.findByIdAndDelete(notificationId);

    if (!deletedNotification) {
      return res.status(404).json({ message: "الإشعار غير موجود" });
    }

    res.status(200).json({ message: "تم حذف الإشعار بنجاح" });
  } catch (error) {
    res.status(500).json({ message: "خطأ في السيرفر أثناء الحذف", error });
  }
};

// تصدير جميع الدوال للاستخدام في ملف الروابط (Routes)
module.exports = {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  deleteNotification // تأكد من إضافة اسم الدالة هنا أيضاً
};