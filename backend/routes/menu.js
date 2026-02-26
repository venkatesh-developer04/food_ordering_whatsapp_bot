const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const MenuItem = require('../models/MenuItem');

// Multer storage config
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

// GET all menu items
router.get('/', async (req, res) => {
    try {
        const items = await MenuItem.find().sort({ category: 1, name: 1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST create menu item
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const { name, description, price, category, isAvailable } = req.body;
        const image = req.file ? `/uploads/${req.file.filename}` : '';
        const item = new MenuItem({ name, description, price: Number(price), category, image, isAvailable: isAvailable !== 'false' });
        await item.save();
        res.status(201).json(item);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT update menu item
router.put('/:id', upload.single('image'), async (req, res) => {
    try {
        const { name, description, price, category, isAvailable } = req.body;
        const update = { name, description, price: Number(price), category, isAvailable: isAvailable !== 'false' };
        if (req.file) update.image = `/uploads/${req.file.filename}`;
        const item = await MenuItem.findByIdAndUpdate(req.params.id, update, { new: true });
        if (!item) return res.status(404).json({ error: 'Item not found' });
        res.json(item);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE menu item
router.delete('/:id', async (req, res) => {
    try {
        const item = await MenuItem.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({ error: 'Item not found' });
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
