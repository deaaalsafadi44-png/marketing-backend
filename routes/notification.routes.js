const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');

// ✅ استيراد الميدلوير الصحيح
const authenticateToken = require("../middlewares/authenticateToken");

// 1. رابط جلب قائمة الإشعارات
router.get('/', authenticateToken, notificationController.getMyNotifications);

// 2. رابط جلب العداد
router.get('/unread-count', authenticateToken, notificationController.getUnreadCount);

// 3. رابط لتحديث الإشعار كـ "مقروء"
router.patch('/:id/read', authenticateToken, notificationController.markAsRead);

// 4. رابط الحذف (تم تصحيح اسم المتغير هنا)
router.delete('/:id', authenticateToken, notificationController.deleteNotification);

module.exports = router;