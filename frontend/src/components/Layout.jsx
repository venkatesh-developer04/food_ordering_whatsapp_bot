import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

const TITLES = {
    '/': 'Dashboard',
    '/menu': 'Menu Management',
    '/orders': 'Orders',
    '/qr': 'WhatsApp QR Code',
    '/settings': 'Settings',
};

export default function Layout() {
    const { pathname } = useLocation();
    const title = TITLES[pathname] || 'Admin Panel';

    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-content">
                <header className="topbar">
                    <h1 className="topbar-title">{title}</h1>
                    <div className="topbar-actions">
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            🍽️ Venkatesh Kitchen
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
