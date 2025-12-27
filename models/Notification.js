const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // معرف الموظف الذي سيستلم الإشعار
  recipientId: { 
    type: String, 
    required: true,
    index: true // لإسراع عملية البحث
  },
  title: { 
    type: String, 
    required: true 
  },
  body: { 
    type: String, 
    required: true 
  },
  // رابط المهمة ليتمكن الموظف من الضغط عليه والذهاب للتاسك فوراً
  url: { 
    type: String 
  },
  // حالة الإشعار (مهم جداً للعداد)
  isRead: { 
    type: Boolean, 
    default: false 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Notification', notificationSchema);