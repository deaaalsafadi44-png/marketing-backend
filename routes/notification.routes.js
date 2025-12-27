const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { verifyToken } = require('../middleware/auth'); // تأكد من اسم ملف الـ middleware عندك

// 1. رابط جلب قائمة الإشعارات
router.get('/', verifyToken, notificationController.getMyNotifications);

// 2. رابط جلب العداد (الرقم الذي سيظهر فوق الجرس)
router.get('/unread-count', verifyToken, notificationController.getUnreadCount);

// 3. رابط لتحديث الإشعار كـ "مقروء"
router.patch('/:id/read', verifyToken, notificationController.markAsRead);

module.exports = router;