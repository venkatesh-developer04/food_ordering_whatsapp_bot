const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const Settings = require('../models/Settings');
const Tenant = require('../models/Tenant');

let cachedSettings = null;
let settingsTimer = 0;
async function getSettings() {
    if (!cachedSettings || Date.now() - settingsTimer > 60000) {
        cachedSettings = (await Settings.findOne()) || (await Settings.create({}));
        settingsTimer = Date.now();
    }
    return cachedSettings;
}


// ─── Per-customer session state ───────────────────────────────────────────────
const sessions = new Map();   // phone → session object
const menuTimers = new Map();  // phone → 15-min interval timer

const STATE = {
    IDLE: 'IDLE',
    AWAITING_NAME: 'AWAITING_NAME',
    SELECTING: 'SELECTING',
    CONFIRMING: 'CONFIRMING',
    DONE: 'DONE',
};

function createSession(phone) {
    return { phone, state: STATE.IDLE, cart: [], name: '', menuItems: [] };
}

function getSession(phone) {
    if (!sessions.has(phone)) sessions.set(phone, createSession(phone));
    return sessions.get(phone);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function fetchMenuItems() {
    return MenuItem.find({ isAvailable: true }).sort({ category: 1, name: 1 });
}

function buildMenuText(items, settings) {
    if (!items.length) return { text: '😔 No items available right now. Please check back later!', items: [] };
    const categories = {};
    items.forEach((item, idx) => {
        if (!categories[item.category]) categories[item.category] = [];
        categories[item.category].push({ ...item.toObject(), index: idx + 1 });
    });

    let text = `🍽️ *${settings.shopName} – Menu*\n\n`;
    for (const [cat, catItems] of Object.entries(categories)) {
        text += `📌 *${cat}*\n`;
        for (const it of catItems) {
            text += `  *${it.index}.* ${it.name} – ₹${it.price}\n`;
            if (it.description) text += `     _${it.description}_\n`;
        }
        text += '\n';
    }
    text += `Reply with item *numbers* to add to cart (e.g., *1 2 3*).\nType *done* to place order | *clear* to empty cart | *quit* to exit.`;
    return { text, items };
}

function buildBill(session, settings) {
    if (!session.cart.length) return '🛒 Your cart is empty — no charges!';
    let bill = `🧾 *Your Bill — ${settings.shopName}*\n\n`;
    let total = 0;
    session.cart.forEach((it, i) => {
        const sub = it.price * it.qty;
        bill += `${i + 1}. ${it.name}  x${it.qty}  → ₹${sub}\n`;
        total += sub;
    });
    bill += `\n💰 *Total: ₹${total}*\n\nThank you for visiting ${settings.shopName}! 🙏\nCome back anytime — type *hi* to order again.`;
    return bill;
}

// ─── 15-min reminder timer ────────────────────────────────────────────────────
async function startMenuReminder(client, phone) {
    clearMenuReminder(phone);          // clear any existing timer
    const timer = setInterval(async () => {
        const session = sessions.get(phone);
        if (!session || session.state === STATE.DONE || session.state === STATE.IDLE) {
            clearMenuReminder(phone);
            return;
        }
        try {
            const items = await fetchMenuItems();
            const settings = await getSettings();
            const { text } = buildMenuText(items, settings);
            const chatId = phone.includes('@c.us') ? phone : `${phone}@c.us`;
            await client.sendMessage(chatId,
                `⏰ *Still hungry?* Here's our menu again:\n\n${text}`
            );
        } catch (e) { console.error('Reminder error:', e.message); }
    }, 15 * 60 * 1000); // every 15 minutes
    menuTimers.set(phone, timer);
}

function clearMenuReminder(phone) {
    if (menuTimers.has(phone)) {
        clearInterval(menuTimers.get(phone));
        menuTimers.delete(phone);
    }
}

// ─── End / quit session ───────────────────────────────────────────────────────
async function handleQuit(msg, session, io, settings) {
    clearMenuReminder(session.phone);
    const bill = buildBill(session, settings);

    // Save partial order if cart has items
    if (session.cart.length > 0) {
        const items = session.cart.map(i => ({
            menuItem: i.menuItemId,
            name: i.name,
            price: i.price,
            quantity: i.qty,
        }));
        const total = session.cart.reduce((s, i) => s + i.price * i.qty, 0);
        const order = new Order({
            customerPhone: session.phone,
            customerName: session.name || 'Customer',
            items, totalAmount: total,
            status: 'pending',
        });
        await order.save();
        io.emit('new-order', order);
    }

    sessions.delete(session.phone);
    await msg.reply(bill);
}

// ─── Main WhatsApp initialiser ────────────────────────────────────────────────
async function initWhatsApp(io, restartFn) {

    // Use system Chrome so we don't need to download Puppeteer's Chromium
    const CHROME_PATH =
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'


    const client = new Client({
        authStrategy: new LocalAuth({ dataPath: './whatsapp-sessions' }),
        puppeteer: {
            headless: true,
            executablePath: CHROME_PATH,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--window-size=1280,720',
            ],
        },
    });

    client.isReady = false;

    // ── QR ──
    client.on('qr', async (qr) => {
        console.log('[INFO] QR generated — scan in admin panel at /qr');
        try {
            const qrImage = await qrcode.toDataURL(qr, { errorCorrectionLevel: 'M', scale: 6 });
            io.emit('whatsapp-qr', { qr: qrImage });
        } catch (e) { console.error('QR toDataURL error:', e); }
    });

    // ── Ready ──
    client.on('ready', () => {
        console.log('[SUCCESS] WhatsApp ready!');
        client.isReady = true;
        io.emit('whatsapp-ready', { status: 'connected' });
    });

    // ── Disconnected — auto reinit so a fresh QR appears ──
    client.on('disconnected', (reason) => {
        console.log('[ERROR] WhatsApp disconnected:', reason);
        client.isReady = false;
        io.emit('whatsapp-disconnected', { reason });
        // Auto restart after 3 s → new QR generated automatically
        if (typeof restartFn === 'function') {
            console.log('[INFO] Auto-restarting WhatsApp in 3 s…');
            setTimeout(restartFn, 3000);
        }
    });

    // ── auth_failure ──
    client.on('auth_failure', (msg) => {
        console.error('Auth failure:', msg);
        io.emit('whatsapp-disconnected', { reason: 'auth_failure' });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // ── Message handler ──
    // ─────────────────────────────────────────────────────────────────────────
    client.on('message', async (msg) => {
        if (msg.isGroupMsg) return;

        const phone = msg.from;
        const text = msg.body.trim();
        const lower = text.toLowerCase();
        const session = getSession(phone);
        const settings = await getSettings();

        try {

            // ── QUIT / EXIT / BYE ───────────────────────────────────────────────
            if (['quit', 'exit', 'bye', 'goodbye', 'stop'].includes(lower)) {
                await handleQuit(msg, session, io, settings);
                return;
            }

            // ── RESTART triggers ─────────────────────────────────────────────────
            if (['hi', 'hello', 'hey', 'start', 'menu', 'order', 'hii', 'hai'].includes(lower)
                || session.state === STATE.IDLE || session.state === STATE.DONE) {
                sessions.set(phone, createSession(phone));
                const s = getSession(phone);
                s.state = STATE.AWAITING_NAME;
                
                let welcome = settings.welcomeMessage || `Welcome to ${settings.shopName}!`;
                welcome = welcome.replace(/\{\{restaurant_name\}\}/g, settings.shopName || 'our shop');
                
                await msg.reply(welcome);
                return;
            }

            // ── AWAITING NAME ────────────────────────────────────────────────────
            if (session.state === STATE.AWAITING_NAME) {
                session.name = text.trim();
                session.state = STATE.SELECTING;
                const items = await fetchMenuItems();
                session.menuItems = items;
                const { text: menuTxt } = buildMenuText(items, settings);
                await msg.reply(
                    `Nice to meet you, *${session.name}*! 😊\n\nHere's our menu:\n\n${menuTxt}`
                );
                startMenuReminder(client, phone);
                return;
            }

            // ── SELECTING ────────────────────────────────────────────────────────
            if (session.state === STATE.SELECTING) {

                // CLEAR cart
                if (lower === 'clear' || lower === 'reset') {
                    session.cart = [];
                    await msg.reply('🗑️ Cart cleared! Send item numbers to order again.');
                    return;
                }

                // VIEW cart
                if (lower === 'cart' || lower === 'view') {
                    if (!session.cart.length) {
                        await msg.reply('🛒 Your cart is empty. Send item numbers to add!');
                    } else {
                        let summary = `🛒 *Your Cart*\n\n`;
                        let total = 0;
                        session.cart.forEach((it, i) => {
                            summary += `${i + 1}. ${it.name} x${it.qty} → ₹${it.price * it.qty}\n`;
                            total += it.price * it.qty;
                        });
                        summary += `\n💰 Total: ₹${total}\n\nType *done* to place order or keep adding items.`;
                        await msg.reply(summary);
                    }
                    return;
                }

                // DONE / CONFIRM
                if (lower === 'done' || lower === 'confirm' || lower === 'order') {
                    if (!session.cart.length) {
                        await msg.reply('🛒 Your cart is empty! Please select items first.');
                        return;
                    }
                    session.state = STATE.CONFIRMING;
                    let summary = `📋 *Order Summary for ${session.name}*\n\n`;
                    let total = 0;
                    session.cart.forEach((it, i) => {
                        summary += `${i + 1}. ${it.name} x${it.qty} → ₹${it.price * it.qty}\n`;
                        total += it.price * it.qty;
                    });
                    summary += `\n💰 *Total: ₹${total}*\n\nReply *yes* to confirm or *no* to cancel.`;
                    await msg.reply(summary);
                    return;
                }

                // SHOW MENU again
                if (lower === 'menu' || lower === 'show menu') {
                    const items = await fetchMenuItems();
                    session.menuItems = items;
                    const { text: menuTxt } = buildMenuText(items, settings);
                    await msg.reply(menuTxt);
                    return;
                }

                // Parse numbers
                const nums = lower.split(/[\s,،]+/).map(n => parseInt(n)).filter(n => !isNaN(n) && n > 0);
                if (!nums.length) {
                    await msg.reply(
                        `❓ I didn't understand that.\n\n` +
                        `• Send item *numbers* (e.g., *1 2 3*) to add to cart\n` +
                        `• Send *menu* to see the menu\n` +
                        `• Send *cart* to view your cart\n` +
                        `• Send *done* to place your order\n` +
                        `• Send *quit* to exit`
                    );
                    return;
                }

                // Refresh menu items in case it changed
                if (!session.menuItems.length) session.menuItems = await fetchMenuItems();

                const added = [];
                for (const num of nums) {
                    const item = session.menuItems[num - 1];
                    if (!item) { await msg.reply(`⚠️ Item *${num}* not found. Please check the menu.`); continue; }
                    const existing = session.cart.find(c => c.menuItemId === item._id.toString());
                    if (existing) {
                        existing.qty += 1;
                        added.push(`${item.name} (now x${existing.qty})`);
                    } else {
                        session.cart.push({ menuItemId: item._id.toString(), name: item.name, price: item.price, qty: 1 });
                        added.push(item.name);
                    }
                }

                if (added.length) {
                    const cartTotal = session.cart.reduce((s, i) => s + i.price * i.qty, 0);
                    const cartCount = session.cart.reduce((s, i) => s + i.qty, 0);
                    await msg.reply(
                        `✅ Added: *${added.join(', ')}*\n\n` +
                        `🛒 Cart: *${cartCount} item(s)* — ₹${cartTotal}\n\n` +
                        `Add more, type *done* to place order, or *quit* to exit.`
                    );
                }
                return;
            }

            // ── CONFIRMING ───────────────────────────────────────────────────────
            if (session.state === STATE.CONFIRMING) {
                if (lower === 'yes' || lower === 'y' || lower === 'ok' || lower === 'confirm') {

                    // Save order
                    const items = session.cart.map(i => ({
                        menuItem: i.menuItemId, name: i.name, price: i.price, quantity: i.qty,
                    }));
                    const total = session.cart.reduce((s, i) => s + i.price * i.qty, 0);
                    const order = new Order({
                        customerPhone: phone,
                        customerName: session.name,
                        items, totalAmount: total,
                        status: 'pending',
                    });
                    await order.save();
                    io.emit('new-order', order);

                    let confirmMsg = settings.orderConfirmMessage || `Order Placed! Order ID: #{{order_id}}. Total: ₹{{total_price}}.`;
                    confirmMsg = confirmMsg
                        .replace(/\{\{order_id\}\}/g, order._id.toString().slice(-6).toUpperCase())
                        .replace(/\{\{total_price\}\}/g, total)
                        .replace(/\{\{restaurant_name\}\}/g, settings.shopName)
                        .replace(/\{\{customer_name\}\}/g, session.name);
                        
                    await msg.reply(confirmMsg);

                    // Reset cart but stay in SELECTING for more orders
                    session.cart = [];
                    session.state = STATE.SELECTING;
                    return;
                }

                if (lower === 'no' || lower === 'n' || lower === 'cancel') {
                    session.state = STATE.SELECTING;
                    session.cart = [];
                    await msg.reply('❌ Order cancelled. Your cart is cleared. Start again or type *quit* to exit.');
                    return;
                }

                await msg.reply('Please reply *yes* to confirm or *no* to cancel your order.');
                return;
            }

            // Fallback
            let fallback = settings.fallbackMessage || `Type 'hi' to order!`;
            fallback = fallback.replace(/\{\{restaurant_name\}\}/g, settings.shopName);
            await msg.reply(fallback);

        } catch (err) {
            console.error('Message handler error:', err);
        }
    });

    // ─── Initialize ───────────────────────────────────────────────────────────
    try {
        await client.initialize();
    } catch (e) {
        console.error('Client initialize error:', e.message);
        throw e;
    }

    return client;
}

module.exports = { initWhatsApp };
