const webpush = require("web-push");
const User = require("../models/User");

/**
 * دالة إرسال إشعار لجميع أجهزة مستخدم محدد
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

 const notificationPayload = JSON.stringify(payload);

    // 1. تعريف خيارات الإرسال لضمان الوصول في الخلفية
    const options = {
        TTL: 86400,     // مدة بقاء الإشعار 24 ساعة في حال كان الجهاز مغلقاً
        urgency: "high" // أولوية قصوى لإيقاظ المتصفح من وضع السكون
    };

    // 3. إنشاء وعود الإرسال لكل جهاز موجود في المصفوفة
    const sendPromises = user.pushSubscriptions.map((subscription) => {
      // ✅ تمرير الـ options هنا كبارامتر ثالث
      return webpush.sendNotification(subscription, notificationPayload, options)
        .then(() => console.log(`✅ Sent to one device for user ${userId}`))
        .catch(async (error) => {
          console.error("❌ Error sending to one device:", error.message);
          
          // تنظيف الأجهزة المنتهية (410 أو 404) من المصفوفة
          if (error.statusCode === 410 || error.statusCode === 404) {
            console.log(`Removing expired device for user ${userId}`);
            await User.updateOne(
              { id: userId }, 
              { $pull: { pushSubscriptions: subscription } } 
            );
          }
        });
    });

    // 4. تنفيذ الإرسال لجميع الأجهزة بالتوازي
    await Promise.all(sendPromises);
    console.log(`✅ All notification attempts completed for user ${userId}`);
    
  } catch (error) {
    console.error("❌ Critical error in notification service:", error);
  }
};

module.exports = {
  sendNotification,
};