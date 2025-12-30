const Task = require("../models/Task");
const { sendNotification } = require("./notifications.service");
const Notification = require("../models/Notification");

let isProcessing = false;

const calculateNextRun = (frequency, baseDate) => {
    let nextDate = new Date(baseDate);
    const now = new Date();
    // نضمن القفز للمستقبل حتماً
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
        // نبحث عن أي مهمة وقتها "حان أو فات" (أقل من أو يساوي الوقت الحالي)
        console.log(`⏱️ [Scheduler] Current Server Time: ${now.toISOString()}`);

        // 1. البحث عن القالب المستحق
        const template = await Task.findOneAndUpdate(
            {
                isScheduled: true,
                nextRun: { $lte: now }, // المهام التي حان وقتها أو فات
                isLocked: { $ne: true }
            },
            { $set: { isLocked: true } },
            { new: true }
        );

        if (!template) {
            isProcessing = false;
            return;
        }

        console.log(`🎯 [Scheduler] Found Task to Execute: "${template.title}"`);

        // 2. إنشاء النسخة التنفيذية أولاً لضمان ظهورها للمستخدم
        const instanceId = Math.floor(Date.now() / 1000);
        const instanceData = {
            ...template.toObject(),
            _id: undefined, 
            id: instanceId,
            isScheduled: false, // النسخة ليست مجدولة
            isLocked: false,
            status: "Pending",
            nextRun: null,
            createdAt: new Date().toISOString()
        };

        const newInstance = await Task.create(instanceData);
        console.log(`✅ [Scheduler] New Instance Created: ID ${instanceId}`);

        // 3. تحديث موعد القالب للمرة القادمة وفك القفل
        const nextRunDate = calculateNextRun(template.frequency, template.nextRun || now);
        
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
        console.log(`📅 [Scheduler] Template rescheduled to: ${nextRunDate.toISOString()}`);

        // 4. إرسال الإشعارات
        if (newInstance) {
            await Notification.create({
                recipientId: newInstance.workerId,
                title: "⏰ موعد مهمة",
                body: `حان موعد تنفيذ: ${newInstance.title}`,
                url: `/tasks/view/${newInstance.id}`
            });

            sendNotification(newInstance.workerId, {
                title: "⏰ مهمة مجدولة",
                body: newInstance.title
            }).catch(e => console.log("Notification send failed"));
        }

    } catch (error) {
        console.error("❌ [Scheduler] Error:", error);
        await Task.updateMany({ isLocked: true }, { $set: { isLocked: false } });
    } finally {
        isProcessing = false;
    }
};

// تشغيل الفحص كل 30 ثانية لضمان الدقة
setInterval(checkScheduledTasks, 30000);

module.exports = { checkScheduledTasks };