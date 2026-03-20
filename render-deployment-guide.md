# Deploying Waitro on Render (Free Tier Step-by-Step)

Because Waitro is a sophisticated architectural ecosystem consisting of **1 Backend** and **3 Frontends** (Landing Page, Control Panel, Tenant Dashboard), deploying it for "free" perfectly fits Render's ecosystem!

Render provides **Free Static Sites** (perfect for your React apps) and a **Free Web Service** (perfect for your Node.js backend). Here is the absolute cleanest, step-by-step way to launch Waitro onto the live internet today.

---

## Step 1: Preparation (The Golden Rule)
Because you won't be using `localhost` anymore, you need to update all your frontends to point to where your backend *will* live (e.g., `https://waitro-backend.onrender.com`).

1. Open [waitro-landing/vite.config.js](file:///c:/venkatesh-developer04/whatsapp_bot/waitro-landing/vite.config.js), [control-panel/vite.config.js](file:///c:/venkatesh-developer04/whatsapp_bot/control-panel/vite.config.js), and [frontend/vite.config.js](file:///c:/venkatesh-developer04/whatsapp_bot/frontend/vite.config.js).
2. Notice how they proxy `/api` to `target: 'http://localhost:5000'`. You will eventually switch this or use Axios `baseURL` explicitly in your production builds!
3. Push your entire `whatsapp_bot` folder to a **Free GitHub Repository**. Ensure all 4 folders are pushed correctly. 

---

## Step 2: Deploying the Node.js Backend 🧠
This is the hardest part. The backend runs your MongoDB commands, the Socket.io instances, and the `whatsapp-web.js` headless browser.

1. Go to **[Render.com](https://render.com/)**, sign up, and click **New > Web Service**.
2. Connect your GitHub account and select your `whatsapp_bot` repository.
3. Configure the settings exactly like this:
   - **Name:** `waitro-backend`
   - **Root Directory:** `backend` (Crucial: This tells Render to only look inside the backend folder).
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start` (Or `node server.js`)
   - **Instance Type:** `Free`
4. Click **Advanced > Environment Variables** and precisely add your secret keys:
   - `MONGODB_URI` = `mongodb+srv://<your-cluster>...`
   - `FRONTEND_URL` = `https://waitro-dashboard.onrender.com` (We'll build this next)
   - `PORT` = `5000`
5. Click **Create Web Service**. 
   - *Note:* Render's Free Tier installs Puppeteer headless chronium for Whatsapp-Web.js. It might take 3–5 minutes. Wait until it says "Live".

---

## Step 3: Deploying the Waitro Landing Page 🌍
Render offers incredibly fast Free Static site hosting for React/Vite.

1. Back on the Render Dashboard, click **New > Static Site**.
2. Select the identical GitHub repository.
3. Configure settings:
   - **Name:** `waitro-landing`
   - **Root Directory:** `waitro-landing`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist` (Vite's default output folder).
4. Click **Create Static Site**.
   - Within 2 minutes, your beautiful Gen-Z landing page will be instantly live on a URL like `waitro-landing.onrender.com`!

---

## Step 4: Deploying the Master Control Panel 🛡️
Repeat the exact same process for your secret owner's admin panel!

1. Click **New > Static Site**.
2. Select your repository.
3. Configure settings:
   - **Name:** `waitro-admin`
   - **Root Directory:** `control-panel`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
4. Click **Create Static Site**.

---

## Step 5: Deploying the Tenant Frontend (Multi-Tenancy) 🏢
This is where your subscribed restaurants will log in.

1. Click **New > Static Site**.
2. Select your repository.
3. Configure settings:
   - **Name:** `waitro-tenant-dashboard`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
4. **THE MULTI-TENANT TRICK:** Render does not natively support wildcard subdomains (e.g. `*.waitro-tenant-dashboard.onrender.com`) cleanly without Cloudflare. 
   - **The Free Fix**: In your frontend [App.jsx](file:///c:/venkatesh-developer04/whatsapp_bot/frontend/src/App.jsx), I originally built a dual-catch system for you! If someone uses `http://waitro-tenant-dashboard.onrender.com/?tenantId=12345`, the system fundamentally bypasses subdomains entirely and securely locks them into their specific restaurant environment!
   - Just tell your customers their unique dashboard URL is explicitly appended with their ID. 

---

## ⚠️ Important Free Tier Limitations (The Catch)
Because you are deploying for exactly $0 as a startup:

1. **Backend Sleep:** Render puts Free Web Services to "sleep" after 15 minutes of zero traffic. When a new customer hits your WhatsApp bot, the first message might take 50 seconds to reply because the server has to "wake up".
   - *Fix:* Use a free cron-job site like [cron-job.org](https://cron-job.org/) to silently ping `https://waitro-backend.onrender.com` every 10 minutes to keep it artificially awake permanently!
2. **WhatsApp Sessions:** Because Render wipes its disk when it spins down temporarily, your WhatsApp session token will periodically reset. You might need to re-scan the QR code if you haven't engineered a persistent MongoDB store for the `whatsapp-web.js` auth session exactly. You can implement `MongoStore` strategy for whatsapp web authentication to permanently preserve sessions across Render reboots.
