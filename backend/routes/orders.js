const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Settings = require('../models/Settings');

// GET all orders
router.get('/', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId) return res.status(401).json({ error: 'Tenant ID required' });

        const { status, page = 1, limit = 10 } = req.query;
        const filter = { tenantId };
        if (status) filter.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const total = await Order.countDocuments(filter);
        const orders = await Order.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('items.menuItem', 'name image');
            
        res.json({
            data: orders,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET dashboard stats
router.get('/stats', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId) return res.status(401).json({ error: 'Tenant ID required' });

        const total = await Order.countDocuments({ tenantId });
        const pending = await Order.countDocuments({ tenantId, status: 'pending' });
        const preparing = await Order.countDocuments({ tenantId, status: 'preparing' });
        const delivered = await Order.countDocuments({ tenantId, status: 'delivered' });
        
        const matchObj = { tenantId: new mongoose.Types.ObjectId(tenantId) };

        const revenueAgg = await Order.aggregate([
            { $match: { ...matchObj, status: { $in: ['confirmed', 'preparing', 'ready', 'delivered'] } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]);
        const revenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

        // Daily revenue last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const dailyRevenue = await Order.aggregate([
            { $match: { ...matchObj, createdAt: { $gte: sevenDaysAgo }, status: { $in: ['confirmed', 'preparing', 'ready', 'delivered'] } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    revenue: { $sum: '$totalAmount' },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        res.json({ total, pending, preparing, delivered, revenue, dailyRevenue });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH update order status
router.patch('/:id/status', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId) return res.status(401).json({ error: 'Tenant ID required' });

        const { status } = req.body;
        const order = await Order.findOneAndUpdate({ _id: req.params.id, tenantId }, { status }, { new: true });
        if (!order) return res.status(404).json({ error: 'Order not found' });

        // Emit socket event and WhatsApp message
        const io = req.app.get('io');
        const waClient = req.app.get('waClient');
        if (io) io.emit('order-status-update', order);
        if (waClient && waClient.isReady) {
            let settings = await Settings.findOne();
            if(!settings) settings = { shopName: 'our shop' };
            const statusMessages = {
                confirmed: '✅ Your order has been *confirmed*! We are getting it ready.',
                preparing: '👨‍🍳 Your order is now being *prepared*!',
                ready: '🎉 Your order is *ready*! Please come pick it up or it will be delivered shortly.',
                delivered: `📦 Your order has been *delivered*! Thank you for ordering from *${settings.shopName}* 🙏`,
                cancelled: '❌ Your order has been *cancelled*. Please contact us for more info.',
            };
            const msg = statusMessages[status];
            if (msg) {
                const chatId = order.customerPhone.includes('@c.us') ? order.customerPhone : `${order.customerPhone}@c.us`;
                waClient.sendMessage(chatId, msg).catch(console.error);
            }
        }

        res.json(order);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// POST create order (from WhatsApp service)
router.post('/', async (req, res) => {
    try {
        const order = new Order(req.body);
        await order.save();
        const io = req.app.get('io');
        if (io) io.emit('new-order', order);
        res.status(201).json(order);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
