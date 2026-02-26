# 🍽️ Venkatesh Kitchen — WhatsApp Food Ordering System

A full-stack food ordering system where customers order via WhatsApp and the shop owner manages everything from a React admin panel.

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express |
| Database | MongoDB Atlas (Mongoose) |
| Real-time | Socket.io |
| WhatsApp | whatsapp-web.js |
| Admin Panel | React (Vite) + Recharts |

---

## 🗂️ Project Structure

```
whatsapp_bot/
├── backend/
│   ├── models/           # MenuItem, Order schemas
│   ├── routes/           # /api/menu, /api/orders
│   ├── services/         # WhatsApp bot logic
│   ├── uploads/          # Menu item images
│   ├── .env              # Environment variables
│   └── server.js         # Entry point
└── frontend/
    ├── src/
    │   ├── api/          # Axios API client
    │   ├── context/      # Socket.io + Theme providers
    │   ├── components/   # Layout, Sidebar
    │   └── pages/        # Dashboard, Menu, Orders, QR, Settings
    └── vite.config.js
```

---

## 🚀 Setup & Running

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

### 1. Backend Setup

```bash
cd backend
npm install
```

Create/update `.env`:
```
MONGODB_URI=mongodb+srv://supermarket:@12345678@cluster0.dcn6ph6.mongodb.net/venkatesh_kitchen?appName=Cluster0
PORT=5000
FRONTEND_URL=http://localhost:5173
SHOP_NAME=Venkatesh Kitchen
```

```bash
npm run dev    # starts on port 5000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev    # starts on port 5173
```

---

## 📱 WhatsApp Bot Flow

```
Customer sends "hi" / "hello" / "menu"
        ↓
Bot asks for customer name
        ↓
Bot shows full menu (categorized with prices)
        ↓
Customer sends item numbers (e.g., "1 3 2")
        ↓
Bot adds items to cart, shows running total
        ↓
Customer sends "done" to confirm
        ↓
Bot shows order summary, asks "yes" or "no"
        ↓
Customer sends "yes" → Order saved to DB
        ↓
Admin panel shows live notification 🔔
        ↓
Admin changes status → Customer gets WhatsApp update
```

### Quick Commands for Customers
| Command | Action |
|---------|--------|
| `hi` / `hello` / `menu` | Start ordering |
| `1`, `2 3`, `1 2 3` | Add items to cart |
| `done` | Proceed to confirmation |
| `clear` | Empty cart |
| `yes` | Confirm & place order |
| `no` | Cancel order |

---

## 🎨 Admin Panel Pages

| Page | URL | Description |
|------|-----|-------------|
| Dashboard | `/` | Stats, revenue chart, recent orders |
| Menu | `/menu` | Add/Edit/Delete menu items with images |
| Orders | `/orders` | Real-time order list with status updates |
| WhatsApp QR | `/qr` | Scan QR to connect WhatsApp |
| Settings | `/settings` | Shop info, color theme, bot messages |

### Color Themes
Go to **Settings → Color Theme** to switch between:
🟠 Saffron · 🔵 Ocean · 🟢 Emerald · 🟣 Violet · 🔴 Rose · 🟡 Amber

---

## 🔌 API Endpoints

### Menu
```
GET    /api/menu          # Get all menu items
POST   /api/menu          # Add menu item (multipart/form-data)
PUT    /api/menu/:id      # Update menu item
DELETE /api/menu/:id      # Delete menu item
```

### Orders
```
GET    /api/orders        # Get all orders (optional ?status=pending)
GET    /api/orders/stats  # Dashboard stats + daily revenue
POST   /api/orders        # Create order (internal/WhatsApp)
PATCH  /api/orders/:id/status   # Update status (triggers WhatsApp msg)
```

### Socket Events
```
whatsapp-qr       → QR code image data URL
whatsapp-ready    → WhatsApp connected
whatsapp-disconnected → WhatsApp disconnected
new-order         → New order placed via WhatsApp
order-status-update → Order status changed
```

---

## 📁 Environment Variables

```bash
MONGODB_URI=<your mongodb atlas uri>
PORT=5000
FRONTEND_URL=http://localhost:5173
SHOP_NAME=Venkatesh Kitchen
```
