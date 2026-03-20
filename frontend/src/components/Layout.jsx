import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useSettings } from '../context/SettingsContext';
import { Store } from 'lucide-react';

const TITLES = {
    '/': 'Dashboard',
    '/menu': 'Menu Management',
    '/orders': 'Orders',
    '/qr': 'WhatsApp QR Code',
    '/settings': 'Settings',
};

export default function Layout() {
    const { pathname } = useLocation();
    const { settings, isLoaded } = useSettings();
    const title = TITLES[pathname] || 'Admin Panel';

    if (!isLoaded) return <div style={{ padding: 20 }}>Loading...</div>;

    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-content">
                <header className="topbar">
                    <h1 className="topbar-title">{title}</h1>
                    <div className="topbar-actions">
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Store size={14} /> {settings?.shopName || 'Shop Name'}
                        </span>
                    </div>
                </header>
                <main className="page-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
