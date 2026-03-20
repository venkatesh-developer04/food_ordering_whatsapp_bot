const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    shopName: { type: String, default: 'Restaurant Name' },
    address: { type: String, default: '123 Main St' },
    contactNumber: { type: String, default: '' },
    openingHours: { type: String, default: '9:00 AM – 10:00 PM' },
    welcomeMessage: { type: String, default: '👋 Welcome to {{restaurant_name}}! 🍽️\n\nI\'m your order assistant.\nWhat\'s your *name* please?' },
    fallbackMessage: { type: String, default: '👋 Type *hi* to start ordering or *menu* to see our menu!\n\n🍽️ {{restaurant_name}}' },
    orderConfirmMessage: { type: String, default: '🎉 *Order Placed!*\n\nOrder ID: *#{{order_id}}*\n💰 Total: *₹{{total_price}}*\n\nWe\'ll update you on your order status.\nType *quit* to exit or keep adding items!' },
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
