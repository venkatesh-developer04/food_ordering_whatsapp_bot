const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
    name: { type: String, required: true },
    subdomain: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
    subscription: {
        plan: { type: String, enum: ['basic', 'pro', 'enterprise'], default: 'basic' },
        startDate: { type: Date, default: Date.now },
        endDate: { type: Date, required: true }
    },
    whatsappStatus: { type: String, default: 'disconnected' }
}, { timestamps: true });

module.exports = mongoose.model('Tenant', tenantSchema);
