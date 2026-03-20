const express = require('express');
const router = express.Router();
const Tenant = require('../../models/Tenant');

// GET all tenants
router.get('/', async (req, res) => {
    try {
        const tenants = await Tenant.find().sort({ createdAt: -1 });
        res.json(tenants);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET single tenant
router.get('/:id', async (req, res) => {
    try {
        const tenant = await Tenant.findById(req.params.id);
        if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
        res.json(tenant);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST new tenant
router.post('/', async (req, res) => {
    try {
        const tenant = new Tenant(req.body);
        await tenant.save();
        res.status(201).json(tenant);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT update tenant
router.put('/:id', async (req, res) => {
    try {
        const tenant = await Tenant.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
        res.json(tenant);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE tenant
router.delete('/:id', async (req, res) => {
    try {
        const tenant = await Tenant.findByIdAndDelete(req.params.id);
        if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
