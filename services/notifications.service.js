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
    
    // 2. التحقق مما إذا كان المستخدم لديه اشتراك مفعل
    if (!user || !user.pushSubscription) {
      console.log(`User ${userId} has no push subscription.`);
      return;
    }

    // 3. تحويل النص المخزن إلى Object
    const subscription = user.pushSubscription;

    // 4. إرسال الإشعار فعلياً عبر خدمة الـ Push الخاصة بالمتصفح
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    console.log(`✅ Notification sent successfully to user ${userId}`);
    
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