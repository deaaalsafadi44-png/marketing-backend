const Task = require("../models/Task");
const { sendNotification } = require("./notifications.service");
const Notification = require("../models/Notification");

let isProcessing = false;

const calculateNextRun = (frequency, baseDate) => {
    // نستخدم التاريخ الذي نمرره كقاعدة (تاريخ المهمة الأصلي)
    let nextDate = new Date(baseDate);
    const now = new Date();

    // القفز بالوقت حتى يتجاوز الوقت الحالي للسيرفر حتماً
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
        // 💡 إضافة هامش كبير (4 ساعات) للبحث في المهام التي قد تكون عالقة بسبب فروق التوقيت
        // هذا سيجعل السيرفر يرى المهام التي جدولتها بتوقيتك المحلي
        const forwardLook = new Date(now.getTime() + (4 * 60 * 60 * 1000)); 

        console.log(`🔎 [Scheduler] Server Time: ${now.toISOString()}`);
        console.log(`🔎 [Scheduler] Looking for tasks due before: ${forwardLook.toISOString()}`);

        const template = await Task.findOneAndUpdate(
            {
                isScheduled: true,
                nextRun: { $lte: forwardLook }, // البحث بهامش وقت واسع
                isLocked: { $ne: true }
            },
            { $set: { isLocked: true } },
            { new: true }
        );

        if (!template) {
            isProcessing = false;
            return;
        }

        console.log(`🎯 [Scheduler] Executing: "${template.title}" (Original Due: ${template.nextRun})`);

        // حساب الموعد القادم بناءً على وقت السيرفر الحالي لضمان عدم التكرار
        const nextRunDate = calculateNextRun(template.frequency, template.nextRun);

        // إنشاء النسخة التنفيذية
        const newInstanceId = Math.floor(Date.now() / 1000);
        const instanceData = {
            ...template.toObject(),
            _id: undefined, 
            id: newInstanceId,
            isScheduled: false,
            isLocked: false,
            status: "Pending",
            nextRun: null,
            createdAt: new Date().toISOString()
        };

        const newInstance = await Task.create(instanceData);

        // تحديث القالب للموعد القادم
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

        if (newInstance) {
            console.log(`✅ [Scheduler] Instance Created Successfully!`);
            // إرسال الإشعارات
            await Notification.create({
                recipientId: newInstance.workerId,
                title: "⏰ مهمة مجدولة",
                body: `حان موعد: ${newInstance.title}`,
                url: `/tasks/view/${newInstance.id}`
            });

            sendNotification(newInstance.workerId, {
                title: "⏰ مهمة مجدولة",
                body: newInstance.title
            }).catch(() => {});
        }

    } catch (error) {
        console.error("❌ [Scheduler] Error:", error);
        await Task.updateMany({ isLocked: true }, { $set: { isLocked: false } });
    } finally {
        isProcessing = false;
    }
};

// فحص كل 30 ثانية
setInterval(checkScheduledTasks, 30000);
module.exports = { checkScheduledTasks };