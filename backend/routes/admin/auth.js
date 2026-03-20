const express = require('express');
const router = express.Router();
const Admin = require('../../models/Admin');

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const admin = await Admin.findOne({ username });
        if (!admin) return res.status(401).json({ error: 'Invalid credentials' });

        const isMatch = await admin.comparePassword(password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

        res.json({ success: true, username: admin.username });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
