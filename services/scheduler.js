const Task = require("../models/Task");
const { sendNotification } = require("./notifications.service");
const Notification = require("../models/Notification");

let isProcessing = false;

const calculateNextRun = (frequency, baseDate) => {
    let nextDate = new Date(baseDate);
    const now = new Date();
    // التأكد من القفز للمستقبل حتماً بالنسبة لوقت السيرفر الحالي
    while (nextDate <= new Date(now.getTime() + 5000)) { 
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
        // البحث فقط عن المهام التي حان وقتها فعلياً (بدون هوامش مستقبلية كبيرة)
        const currentSearchTime = new Date(now.getTime() + 10000); 

        // 1. القفل الذري: نبحث عن مهمة ونحدث وقتها فوراً قبل معالجتها
        const template = await Task.findOneAndUpdate(
            {
                isScheduled: true,
                nextRun: { $lte: currentSearchTime },
                isLocked: { $ne: true }
            },
            { $set: { isLocked: true } }, // قفل المهمة لمنع التكرار
            { new: true }
        );

        if (!template) {
            isProcessing = false;
            return;
        }

        console.log(`🎯 [Scheduler] Processing: "${template.title}"`);

        // 2. تحديث الموعد القادم وفتح القفل "أولاً"
        const nextRunDate = calculateNextRun(template.frequency, template.nextRun);
        
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

        // 3. إنشاء النسخة التنفيذية (بمعرف فريد لمنع تكرار الإشعارات)
        const instanceId = Math.floor(Date.now() / 1000);
        const instanceData = {
            ...template.toObject(),
            _id: undefined,
            id: instanceId,
            isScheduled: false, // 🛑 هام جداً: النسخة الناتجة ليست جدولاً
            isLocked: false,
            status: "Pending",
            nextRun: null,
            createdAt: new Date().toISOString()
        };

        const newInstance = await Task.create(instanceData);

        if (newInstance) {
            console.log(`✅ [Scheduler] Success: Instance ${instanceId} created.`);
            
            // إرسال إشعار واحد فقط
            await Notification.create({
                recipientId: newInstance.workerId,
                title: "⏰ مهمة مجدولة",
                body: `تذكير: موعد تنفيذ "${newInstance.title}"`,
                url: `/tasks/view/${newInstance.id}`
            });

            sendNotification(newInstance.workerId, {
                title: "⏰ مهمة مجدولة",
                body: newInstance.title
            }).catch(() => {});
        }

    } catch (error) {
        console.error("❌ [Scheduler] Error:", error);
        // تأكد من فك أي قفل عالق
        await Task.updateMany({ isLocked: true }, { $set: { isLocked: false } });
    } finally {
        isProcessing = false;
    }
};

// فحص كل دقيقة واحدة (لتجنب الضغط على السيرفر ومنع التكرار اللحظي)
setInterval(checkScheduledTasks, 60000);

module.exports = { checkScheduledTasks };