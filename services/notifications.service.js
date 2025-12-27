const webpush = require("web-push");
const User = require("../models/User");

/**
 * دالة إرسال إشعار لمستخدم محدد
 * @param {Number} userId - معرف المستخدم (ID)
 * @param {Object} payload - محتوى الإشعار (العنوان والرسالة)
 */
const sendNotification = async (userId, payload) => {
  try {
    // 1. البحث عن المستخدم في القاعدة لجلب الـ Subscription الخاص بمتصفحه
    const user = await User.findOne({ id: userId });
    
  // التحقق من وجود مصفوفة الاشتراكات وأنها ليست فارغة
if (!user || !user.pushSubscriptions || user.pushSubscriptions.length === 0) {
  console.log(`User ${userId} has no active push subscriptions.`);
  return;
}

    // 3. تحويل النص المخزن إلى Object
    const subscription = user.pushSubscription;

    // 4. إرسال الإشعار فعلياً عبر خدمة الـ Push الخاصة بالمتصفح
const notificationPayload = JSON.stringify(payload);

// إنشاء قائمة بوعود الإرسال لكل جهاز
const sendPromises = user.pushSubscriptions.map((subscription) => {
  return webpush.sendNotification(subscription, notificationPayload)
    .catch(async (error) => {
      console.error("❌ Error sending to one device:", error.message);
      
      // تنظيف الأجهزة التي انتهت صلاحيتها (410 أو 404)
      if (error.statusCode === 410 || error.statusCode === 404) {
        console.log(`Removing expired device for user ${userId}`);
        await User.updateOne(
          { id: userId }, 
          { $pull: { pushSubscriptions: subscription } } // حذف الجهاز المعطل فقط من المصفوفة
        );
      }
    });
});

// تنفيذ الإرسال لكل الأجهزة بالتوازي
await Promise.all(sendPromises);    console.log(`✅ Notification sent successfully to user ${userId}`);
    
  } catch (error) {
    console.error("❌ Error sending notification:", error);
    
    // إذا كان الخطأ أن الاشتراك انتهى (410) أو غير موجود (404)، نقوم بحذفه من القاعدة
    if (error.statusCode === 410 || error.statusCode === 404) {
        console.log(`Cleaning up expired subscription for user ${userId}`);
        await User.updateOne({ id: userId }, { $set: { pushSubscription: null } });
    }
  }
};

module.exports = {
  sendNotification,
};