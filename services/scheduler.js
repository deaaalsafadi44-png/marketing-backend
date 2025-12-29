const Task = require("../models/Task");
const { sendNotification } = require("./notifications.service");
const Notification = require("../models/Notification");

let isProcessing = false;

const calculateNextRun = (frequency, lastNextRun) => {
    const now = new Date();
    // نستخدم الوقت الحالي كمرجع أساسي للحساب لضمان عدم التعلق في الماضي
    let nextDate = lastNextRun ? new Date(lastNextRun) : new Date();

    while (nextDate <= now) {
        if (frequency === "daily") nextDate.setDate(nextDate.getDate() + 1);
        else if (frequency === "weekly") nextDate.setDate(nextDate.getDate() + 7);
        else if (frequency === "monthly") nextDate.setMonth(nextDate.getMonth() + 1);
        else return null;
    }
    return nextDate;
};

const checkScheduledTasks = async () => {
    if (isProcessing) return;
    isProcessing = true;

    try {
        const now = new Date();
        // أضفنا هامش 30 ثانية لتلافي فروقات التوقيت البسيطة بين السيرفرات
        const searchTime = new Date(now.getTime() + 30000); 

        console.log(`🔍 [Scheduler] Checking tasks for time <= ${searchTime.toISOString()}`);

        // 1. البحث عن قالب مستحق - تم تبسيط الفلتر لضمان الإمساك بالمهمة
        const template = await Task.findOneAndUpdate(
            {
                isScheduled: true,
                nextRun: { $lte: searchTime },
                isLocked: { $ne: true }
            },
            { $set: { isLocked: true } },
            { new: true }
        );

        if (!template) {
            // console.log("ℹ️ [Scheduler] No pending scheduled tasks found.");
            isProcessing = false;
            return;
        }

        console.log(`🎯 [Scheduler] Found task: "${template.title}" | Original NextRun: ${template.nextRun}`);

        // 2. حساب الموعد القادم
        const nextRunDate = calculateNextRun(template.frequency, template.nextRun);

        // 3. إنشاء النسخة التنفيذية فوراً
        const newInstanceId = Math.floor(Date.now() / 1000);
        const instanceData = {
            ...template.toObject(),
            _id: undefined, 
            id: newInstanceId,
            isScheduled: false, // النسخة ليست مجدولة
            isLocked: false,
            status: "Pending",
            nextRun: null,
            createdAt: new Date().toISOString()
        };

        const newInstance = await Task.create(instanceData);
        console.log(`✅ [Scheduler] Created Instance ID: ${newInstanceId}`);

        // 4. تحديث القالب للموعد القادم وفتح القفل
        await Task.updateOne(
            { _id: template._id },
            { 
                $set: { 
                    nextRun: nextRunDate, 
                    isScheduled: nextRunDate !== null,
                    isLocked: false 
                } 
            }
        );

        // 5. إرسال الإشعارات
        if (newInstance) {
            await Notification.create({
                recipientId: newInstance.workerId,
                title: "⏰ مهمة مجدولة جديدة",
                body: `حان موعد تنفيذ: ${newInstance.title}`,
                url: `/tasks/view/${newInstance.id}`
            });

            sendNotification(newInstance.workerId, {
                title: "⏰ مهمة مجدولة",
                body: newInstance.title
            }).catch(err => console.error("Notification Error:", err));
        }

    } catch (error) {
        console.error("❌ [Scheduler] Error:", error);
        // فك قفل أي مهمة علقت بسبب الخطأ
        await Task.updateMany({ isLocked: true }, { $set: { isLocked: false } });
    } finally {
        isProcessing = false;
    }
};

// فحص كل 30 ثانية ليكون أسرع في الاستجابة
setInterval(checkScheduledTasks, 30000);

module.exports = { checkScheduledTasks };