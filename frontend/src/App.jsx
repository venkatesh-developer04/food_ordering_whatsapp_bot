import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import MenuManagement from './pages/MenuManagement';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import Orders from './pages/Orders';
import QRPage from './pages/QRPage';
import Settings from './pages/Settings';
import axios from 'axios';
import { useState, useEffect } from 'react'; // Added for state and effects

function MainApp() {
    const [sub, setSub] = useState(null);
    const [isResolving, setIsResolving] = useState(true);
    const [noTenant, setNoTenant] = useState(false);

    useEffect(() => {
        const resolveTenant = async () => {
            const hostname = window.location.hostname;
            const parts = hostname.split('.');
            let currentTenantId = localStorage.getItem('tenantId');

            if (parts.length >= 2 && parts[0] !== 'localhost' && parts[0] !== '127') {
                try {
                    const res = await axios.get(`/api/settings/tenant-lookup/${parts[0]}`);
                    if (res.data?.tenantId) {
                        currentTenantId = res.data.tenantId;
                        localStorage.setItem('tenantId', currentTenantId);
                    }
                } catch (e) { console.error('Subdomain lookup failed', e); }
            }

            const queryParams = new URLSearchParams(window.location.search);
            const urlTenant = queryParams.get('tenantId');
            if (urlTenant) {
                currentTenantId = urlTenant;
                localStorage.setItem('tenantId', currentTenantId);
                window.history.replaceState({}, document.title, "/"); 
            }

            if (!currentTenantId) {
                setNoTenant(true);
                setIsResolving(false);
                return;
            }

            try {
                const subRes = await axios.get('/api/settings/subscription', { 
                    headers: { 'x-tenant-id': currentTenantId }
                });
                setSub(subRes.data);
            } catch (e) { console.error(e); }
            
            setIsResolving(false);
        };
        resolveTenant();
    }, []);

    if (isResolving) {
        return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Tenant Data...</div>;
    }

    if (noTenant) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc', color: '#1e293b', textAlign: 'center', padding: 24 }}>
                <h1 style={{ color: '#ef4444', marginBottom: 16 }}>Tenant Not Found</h1>
                <p>We couldn't identify which restaurant dashboard you are trying to access.</p>
                <p style={{ marginTop: 8 }}>Please access this panel through your specific subdomain (e.g., <b>http://your-restaurant.localhost:5175/</b>)</p>
            </div>
        );
    }

    if (sub?.isExpired) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc', color: '#1e293b' }}>
                <h1 style={{ color: '#ef4444', marginBottom: 16 }}>Subscription Expired</h1>
                <p>Your {sub.plan} plan ended on {new Date(sub.endDate).toLocaleDateString()}.</p>
                <p>Please contact support to renew your plan and restore access.</p>
            </div>
        );
    }

    return (
        <SocketProvider>
            <BrowserRouter>
            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        background: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-light)',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '0.88rem',
                    },
                    success: {
                        iconTheme: { primary: 'var(--primary)', secondary: 'white' },
                    },
                }}
            />
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="orders" element={<Orders />} />
                    <Route path="menu" element={<MenuManagement />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="qr" element={<QRPage />} />
                </Route>
            </Routes>
            </BrowserRouter>
        </SocketProvider>
    );
}

export default function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <MainApp />
      </SettingsProvider>
    </ThemeProvider>
  );
}
