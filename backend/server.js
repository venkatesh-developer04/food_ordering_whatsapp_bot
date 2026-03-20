require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/orders');
const settingsRoutes = require('./routes/settings');
const adminAuthRoutes = require('./routes/admin/auth');
const adminTenantRoutes = require('./routes/admin/tenants');

const Admin = require('./models/Admin');
const { initWhatsApp } = require('./services/whatsappService');

const app = express();
const server = http.createServer(app);

// ─── Socket.io ────────────────────────────────────────────────────────────────
const io = new Server(server, {
    cors: {
        origin: true, // Allow dynamic subdomains like tenant.localhost:5174
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        credentials: true,
    },
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

app.set('io', io);

// ─── MongoDB ──────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('[SUCCESS] MongoDB connected'))
    .catch(err => console.error('[ERROR] MongoDB error:', err.message));

// ─── REST Routes ──────────────────────────────────────────────────────────────
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/tenants', adminTenantRoutes);
app.get('/api/health', (_req, res) => res.json({
    status: 'ok',
    shop: process.env.SHOP_NAME,
    wa: app.get('waClient')?.isReady ? 'connected' : 'disconnected',
}));

// ─── WhatsApp state cache ─────────────────────────────────────────────────────
// Stores the latest QR so new browser connections see it immediately
let latestQR = null;
let waConnected = false;

// Intercept io.emit to keep cache fresh
const _origEmit = io.emit.bind(io);
io.emit = function (event, ...args) {
    if (event === 'whatsapp-qr' && args[0]) { latestQR = args[0].qr; waConnected = false; }
    if (event === 'whatsapp-ready') { waConnected = true; latestQR = null; }
    if (event === 'whatsapp-disconnected') { waConnected = false; }
    return _origEmit(event, ...args);
};

// ─── WhatsApp lifecycle ───────────────────────────────────────────────────────
let waClient = null;
let isRestarting = false;

async function startWhatsApp() {
    if (isRestarting) return;
    isRestarting = true;

    // Destroy old client if it exists
    if (waClient) {
        try { await waClient.destroy(); } catch (_) { }
        waClient = null;
        app.set('waClient', null);
    }

    // Show spinner on the frontend while reinitialising
    io.emit('whatsapp-restarting', {});

    try {
        waClient = await initWhatsApp(io, 
            
        );   // pass restartFn so service can trigger it
        app.set('waClient', waClient);
    } catch (err) {
        console.error('[ERROR] WhatsApp init failed:', err.message);
        io.emit('whatsapp-disconnected', { reason: err.message });
    } finally {
        isRestarting = false;
    }
}

async function logoutWhatsApp() {
    if (!waClient) return;
    try {
        await waClient.logout();           // clears local auth session
        await waClient.destroy();
    } catch (_) { }
    waClient = null;
    waConnected = false;
    latestQR = null;
    app.set('waClient', null);
    io.emit('whatsapp-disconnected', { reason: 'manual_logout' });
    // Small delay then reinitialise so a fresh QR appears
    setTimeout(startWhatsApp, 2000);
}

// ─── Socket.io events from admin panel ───────────────────────────────────────
io.on('connection', (socket) => {
    console.log(`[SOCKET] Admin connected: ${socket.id}`);

    // Send current state immediately so the page doesn't wait
    if (waConnected) {
        socket.emit('whatsapp-ready', { status: 'connected' });
    } else if (latestQR) {
        socket.emit('whatsapp-qr', { qr: latestQR });
    }

    // Admin clicks "Reconnect" button
    socket.on('restart-whatsapp', () => {
        console.log('[SOCKET] Admin requested WhatsApp restart');
        startWhatsApp();
    });

    // Admin clicks "Disconnect" button
    socket.on('logout-whatsapp', () => {
        console.log('[SOCKET] Admin requested WhatsApp logout');
        logoutWhatsApp();
    });

    socket.on('disconnect', () => console.log(`[SOCKET] Admin disconnected: ${socket.id}`));
});

// ─── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
    console.log(`[INFO] Server running on http://localhost:${PORT}`);

    // Seed default admin if not exists
    const adminExists = await Admin.findOne({ username: 'venkatesh' });
    if (!adminExists) await Admin.create({ username: 'venkatesh', password: 'Venkat%2003' });

    await startWhatsApp();
});

module.exports = { app, server };
