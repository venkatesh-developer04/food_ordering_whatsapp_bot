const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 1 },
});

const OrderSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    customerPhone: { type: String, required: true },
    customerName: { type: String, default: 'Customer' },
    items: [OrderItemSchema],
    totalAmount: { type: Number, required: true },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
        default: 'pending',
    },
    notes: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
