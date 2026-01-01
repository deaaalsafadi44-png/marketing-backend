const webpush = require("web-push");
const User = require("../models/User");

/**
 * دالة إرسال إشعار لجميع أجهزة مستخدم محدد
 * تم التعديل لضمان إرسال Payload بتنسيق يدعم المنبثقات (Push Popups)
 */
const sendNotification = async (userId, payload) => {
    try {
        // 1. جلب المستخدم مع مصفوفة الاشتراكات
        const user = await User.findOne({ id: userId });
        
        // 2. التحقق من وجود اشتراكات فعالة في المصفوفة
        if (!user || !user.pushSubscriptions || user.pushSubscriptions.length === 0) {
            console.log(`User ${userId} has no active push subscriptions.`);
            return;
        }

        // ✅ التعديل الجوهري: إعادة صياغة الـ Payload ليكون كائن JSON متوافق مع معايير المتصفح
        // هذا يضمن أن الـ Service Worker سيجد العناوين والنصوص بوضوح
        const notificationPayload = JSON.stringify({
            title: payload.title || "تنبيه جديد 🔔",
            body: payload.body || "لديك إشعار جديد في النظام",
            icon: payload.icon || "/logo192.png", // تأكد من وجود صورة اللوجو في مجلد public
            badge: "/badge.png",                // أيقونة صغيرة تظهر في شريط المهام
            data: {
                url: payload.url || "/tasks",   // الرابط الذي سيفتح عند النقر على الإشعار
                timestamp: Date.now()
            },
            // خيارات إضافية لضمان الظهور كمنبثق
            vibrate: [100, 50, 100],
            requireInteraction: true // يبقى الإشعار ظاهراً حتى يتفاعل معه المستخدم
        });

        // 3. تعريف خيارات الإرسال لضمان الوصول في الخلفية
        const options = {
            TTL: 86400,     // مدة بقاء الإشعار 24 ساعة
            urgency: "high" // أولوية قصوى لإيقاظ المتصفح
        };

        // 4. إنشاء وعود الإرسال لكل جهاز موجود في المصفوفة
        const sendPromises = user.pushSubscriptions.map((subscription) => {
            return webpush.sendNotification(subscription, notificationPayload, options)
                .then(() => console.log(`✅ Popup Sent successfully to device for user ${userId}`))
                .catch(async (error) => {
                    console.error("❌ Error sending to one device:", error.message);
                    
                    // تنظيف الأجهزة المنتهية (410 أو 404) من المصفوفة لضمان جودة الأداء لاحقاً
                    if (error.statusCode === 410 || error.statusCode === 404) {
                        console.log(`Removing expired device for user ${userId}`);
                        await User.updateOne(
                            { id: userId }, 
                            { $pull: { pushSubscriptions: subscription } } 
                        );
                    }
                });
        });

        // 5. تنفيذ الإرسال لجميع الأجهزة بالتوازي
        await Promise.all(sendPromises);
        console.log(`✅ All notification attempts completed for user ${userId}`);
        
    } catch (error) {
        console.error("❌ Critical error in notification service:", error);
    }
};

module.exports = {
    sendNotification,
};