const Task = require("../models/Task");
const { sendNotification } = require("./notifications.service");
const Notification = require("../models/Notification");

let isProcessing = false;

const checkScheduledTasks = async () => {
    if (isProcessing) return;
    isProcessing = true;

    try {
        const now = new Date();
        console.log(`⏱️ [Scheduler] Server UTC: ${now.toISOString()}`);

        // 1. جلب كل المهام المجدولة التي ليست مقفلة
        const scheduledTasks = await Task.find({
            isScheduled: true,
            isLocked: { $ne: true },
            frequency: { $ne: "none" }
        });

        for (const template of scheduledTasks) {
            // تحويل nextRun من نص (String) إلى كائن تاريخ (Date) للمقارنة
            const taskNextRun = new Date(template.nextRun);

            // إذا كان التاريخ صالحاً وحان وقته (أو فات)
            if (!isNaN(taskNextRun) && taskNextRun <= now) {
                
                console.log(`🎯 [Scheduler] Executing: ${template.title}`);

                // قفل المهمة فوراً في قاعدة البيانات لمنع النسخ الأخرى
                const locked = await Task.findOneAndUpdate(
                    { _id: template._id, isLocked: { $ne: true } },
                    { $set: { isLocked: true } },
                    { new: true }
                );

                if (!locked) continue;

                // حساب الموعد القادم (بعد يوم، أسبوع، إلخ)
                let nextDate = new Date(taskNextRun);
                if (template.frequency === "daily") nextDate.setDate(nextDate.getDate() + 1);
                else if (template.frequency === "weekly") nextDate.setDate(nextDate.getDate() + 7);
                else if (template.frequency === "monthly") nextDate.setMonth(nextDate.getMonth() + 1);
                
                // التأكد أن الموعد القادم هو فعلياً في المستقبل
                while (nextDate <= now) {
                   nextDate.setDate(nextDate.getDate() + 1); 
                }

                // إنشاء النسخة التنفيذية (المهمة التي ستظهر للموظف)
                const instanceId = Math.floor(Date.now() / 1000);
                await Task.create({
                    ...template.toObject(),
                    _id: undefined,
                    id: instanceId,
                    isScheduled: false, // مهم جداً
                    isLocked: false,
                    status: "Pending",
                    nextRun: null,
                    createdAt: new Date().toISOString()
                });

                // تحديث القالب للموعد القادم وفتح القفل
                await Task.updateOne(
                    { _id: template._id },
                    { 
                        $set: { 
                            nextRun: nextDate.toISOString(), 
                            isLocked: false 
                        } 
                    }
                );

                // إرسال الإشعارات
                await Notification.create({
                    recipientId: template.workerId,
                    title: "⏰ مهمة مجدولة",
                    body: `حان موعد: ${template.title}`,
                    url: `/tasks/view/${instanceId}`
                });

                sendNotification(template.workerId, {
                    title: "⏰ مهمة مجدولة",
                    body: template.title
                }).catch(() => {});

                console.log(`✅ [Scheduler] Done processing: ${template.title}`);
            }
        }
    } catch (error) {
        console.error("❌ [Scheduler] Error:", error);
        await Task.updateMany({ isLocked: true }, { $set: { isLocked: false } });
    } finally {
        isProcessing = false;
    }
};

// فحص كل 40 ثانية (توازن بين الدقة وعدم الضغط)
setInterval(checkScheduledTasks, 40000);

module.exports = { checkScheduledTasks };