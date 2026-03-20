const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const Tenant = require('../models/Tenant');

// Get settings
router.get('/', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        const settings = await Settings.findOneAndUpdate(
            tenantId ? { tenantId } : {},
            req.body,
            { new: true, upsert: true }
        );
        res.json(settings || {});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/subscription', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        const tenant = tenantId ? await Tenant.findById(tenantId) : await Tenant.findOne();
        if (!tenant) return res.json({ active: true }); // Default ignore if no tenants
        const isExpired = new Date() > new Date(tenant.subscription.endDate);
        res.json({
            plan: tenant.subscription.plan,
            endDate: tenant.subscription.endDate,
            isExpired
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/tenant-lookup/:subdomain', async (req, res) => {
    try {
        const tenant = await Tenant.findOne({ subdomain: req.params.subdomain });
        if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
        res.json({ tenantId: tenant._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update settings
router.put('/', async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings(req.body);
            await settings.save();
        } else {
            Object.assign(settings, req.body);
            await settings.save();
        }
        req.app.get('io').emit('settings-updated', settings);
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
